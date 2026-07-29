import {
  StrategiesRepository,
  StrategyObjectivesRepository,
  StrategyStepsRepository,
  type DbClient,
  type ListOptions,
  type PaginatedResult,
  type Strategy,
  type StrategyObjective,
  type StrategyStep,
} from '@vektor/db';
import { assertAdmin, type ActorContext } from '../shared/actor-context';
import {
  AutorizacaoInsuficienteError,
  EstrategiaEncerradaError,
  EstrategiaJaAtivaError,
  EtapaForaDeOrdemError,
  EtapaSemConteudoError,
  NaoEncontradoError,
} from '../shared/errors';
import type { MembersRepositoryFactory } from '../shared/ports';
import { STEP_DEPENDENCIES, type StepType } from './step-dependencies';

export interface IniciarFormulacaoInput {
  /** Preenchido apenas pelo mecanismo de "Evoluir Estratégia" (RFC-005, ADR-002) — fora do escopo desta Fase. */
  evolvedFromStrategyId?: string;
}

/**
 * RFC-001 — módulo Estratégia: formulação (11 etapas do Marketing Planning
 * Framework) e síntese. Não executa, não mede, não aprende (RFC-001,
 * "Escopo") — a geração da proposta de handoff (Campanha/Tática/Ação) ao
 * aprovar a síntese é intencionalmente NÃO implementada aqui: `B16`
 * (`ARCHITECTURE_RESOLUTION.md`) permanece sem decisão sobre o modelo de
 * persistência dessa proposta, e a responsabilidade é de `ExecucaoService`
 * (RFC-002, Fase 3), fora do escopo desta Fase 1.
 *
 * Toda leitura-antes-de-escrever de um mesmo método roda contra o mesmo
 * `DbClient` (a transação, quando há uma) — nenhum método lê fora e escreve
 * dentro de transações diferentes.
 */
export class EstrategiaService {
  constructor(
    private readonly db: DbClient,
    private readonly membersRepositoryFactory: MembersRepositoryFactory,
  ) {}

  /**
   * ADR-008/ADR-003: só pode existir se o Workspace não tiver Estratégia
   * ativa. ADR-015: a linha nasce com `status = 'ativa'` desde já — não há
   * estado de rascunho intermediário.
   *
   * Aceita um `dbClient` externo para ser composto dentro da transação de um
   * chamador futuro (ex.: `AprendizadoService.evoluirEstrategia`, B6) — sem
   * ele, abre sua própria transação.
   */
  async iniciarFormulacao(
    actor: Pick<ActorContext, 'workspaceId'>,
    input: IniciarFormulacaoInput = {},
    dbClient?: DbClient,
  ): Promise<Strategy> {
    if (dbClient) {
      return this.iniciarFormulacaoComClient(actor, input, dbClient);
    }
    return this.db.transaction((tx) => this.iniciarFormulacaoComClient(actor, input, tx));
  }

  private async iniciarFormulacaoComClient(
    actor: Pick<ActorContext, 'workspaceId'>,
    input: IniciarFormulacaoInput,
    dbClient: DbClient,
  ): Promise<Strategy> {
    const strategiesRepository = new StrategiesRepository(dbClient);

    const ativaExistente = await this.buscarAtivaInterno(strategiesRepository, actor.workspaceId);
    if (ativaExistente) {
      throw new EstrategiaJaAtivaError(actor.workspaceId);
    }

    if (input.evolvedFromStrategyId) {
      const anterior = await strategiesRepository.findById(actor.workspaceId, input.evolvedFromStrategyId);
      if (!anterior) {
        throw new NaoEncontradoError('Estratégia', input.evolvedFromStrategyId);
      }
      if (anterior.status !== 'encerrada') {
        throw new EstrategiaJaAtivaError(actor.workspaceId);
      }
    }

    return strategiesRepository.create({
      workspaceId: actor.workspaceId,
      evolvedFromStrategyId: input.evolvedFromStrategyId ?? null,
    });
  }

  async obterEstrategiaAtiva(actor: Pick<ActorContext, 'workspaceId'>): Promise<Strategy | null> {
    const strategiesRepository = new StrategiesRepository(this.db);
    const ativa = await this.buscarAtivaInterno(strategiesRepository, actor.workspaceId);
    return ativa ?? null;
  }

  async obterEstrategia(
    actor: Pick<ActorContext, 'workspaceId'>,
    strategyId: string,
    dbClient: DbClient = this.db,
  ): Promise<Strategy> {
    const strategiesRepository = new StrategiesRepository(dbClient);
    const strategy = await strategiesRepository.findById(actor.workspaceId, strategyId);
    if (!strategy) {
      throw new NaoEncontradoError('Estratégia', strategyId);
    }
    return strategy;
  }

  async listarEstrategias(
    actor: Pick<ActorContext, 'workspaceId'>,
    options?: ListOptions,
  ): Promise<PaginatedResult<Strategy>> {
    const strategiesRepository = new StrategiesRepository(this.db);
    return strategiesRepository.findByWorkspace(actor.workspaceId, options);
  }

  async listarEtapas(
    actor: Pick<ActorContext, 'workspaceId'>,
    strategyId: string,
  ): Promise<PaginatedResult<StrategyStep>> {
    await this.obterEstrategia(actor, strategyId);
    const stepsRepository = new StrategyStepsRepository(this.db);
    return stepsRepository.findByStrategy(actor.workspaceId, strategyId, { limit: 20 });
  }

  /**
   * Preenchimento de conteúdo (rascunho, sugestão de IA revisada, etc.) —
   * qualquer Membro `ativo` pode fazer, independentemente de `role`
   * (não está na tabela de operações sensíveis de ADR-012). Não exige
   * ordem de dependência: a ordem só é imposta na aprovação
   * (`aprovarEtapa`), conforme RFC-001, critério nº2.
   */
  async preencherEtapa(
    actor: Pick<ActorContext, 'workspaceId'>,
    strategyId: string,
    stepType: StepType,
    content: unknown,
  ): Promise<StrategyStep> {
    return this.db.transaction(async (tx) => {
      const strategy = await this.obterEstrategiaAtivaObrigatoria(actor, strategyId, tx);
      const stepsRepository = new StrategyStepsRepository(tx);
      const existente = await this.buscarEtapa(stepsRepository, actor.workspaceId, strategy.id, stepType);

      if (existente) {
        const atualizada = await stepsRepository.update(actor.workspaceId, existente.id, {
          content,
          updatedAt: new Date(),
        });
        if (!atualizada) {
          throw new NaoEncontradoError('Etapa da Estratégia', existente.id);
        }
        return atualizada;
      }

      return stepsRepository.create({
        workspaceId: actor.workspaceId,
        strategyId: strategy.id,
        stepType,
        content,
      });
    });
  }

  /**
   * ADR-012: aprovar uma etapa (incluindo a síntese, etapa 11) exige Membro
   * com `role = 'admin'`. RFC-001, critério nº2: todas as etapas das quais
   * `stepType` depende precisam já estar aprovadas.
   *
   * `assertAdmin` falha rápido a partir do `ActorContext` já resolvido, sem
   * tocar o banco. Dentro da transação, `assertAindaAdmin` reconfirma isso
   * contra a linha real de `members` no exato momento da escrita — ADR-014 e
   * A4 exigem que a revogação de acesso seja checada a cada requisição,
   * nunca confiada a um valor resolvido antes e apenas repassado.
   */
  async aprovarEtapa(actor: ActorContext, strategyId: string, stepType: StepType): Promise<StrategyStep> {
    assertAdmin(actor, `aprovar etapa "${stepType}" da formulação`);

    return this.db.transaction(async (tx) => {
      await this.assertAindaAdmin(actor, tx);
      const strategy = await this.obterEstrategiaAtivaObrigatoria(actor, strategyId, tx);
      const stepsRepository = new StrategyStepsRepository(tx);
      const todas = await stepsRepository.findByStrategy(actor.workspaceId, strategy.id, { limit: 20 });

      for (const dependencia of STEP_DEPENDENCIES[stepType]) {
        const etapaDependencia = todas.items.find((step) => step.stepType === dependencia);
        if (!etapaDependencia || !etapaDependencia.approvedAt) {
          throw new EtapaForaDeOrdemError(stepType, dependencia);
        }
      }

      const alvo = todas.items.find((step) => step.stepType === stepType);
      if (!alvo || alvo.content === null || alvo.content === undefined) {
        throw new EtapaSemConteudoError(stepType);
      }

      const aprovada = await stepsRepository.update(actor.workspaceId, alvo.id, {
        approvedBy: actor.memberId,
        approvedAt: new Date(),
      });
      if (!aprovada) {
        throw new NaoEncontradoError('Etapa da Estratégia', alvo.id);
      }

      // Handoff de Execução (RFC-001, "O handoff") não é acionado aqui, mesmo
      // quando `stepType === 'sintese'`: B16 (`ARCHITECTURE_RESOLUTION.md`)
      // permanece sem decisão sobre o modelo de persistência da proposta, e a
      // criação de Campanha/Tática/Ação pertence a `ExecucaoService`
      // (RFC-002), Fase 3 — fora do escopo desta Fase 1.
      return aprovada;
    });
  }

  /** RFC-001 (etapa "Objetivos"); RFC-003, critério nº2. Qualquer Membro ativo — não está na lista de ADR-012. */
  async adicionarObjetivo(
    actor: Pick<ActorContext, 'workspaceId'>,
    strategyId: string,
    description: string,
  ): Promise<StrategyObjective> {
    return this.db.transaction(async (tx) => {
      const strategy = await this.obterEstrategiaAtivaObrigatoria(actor, strategyId, tx);
      const objectivesRepository = new StrategyObjectivesRepository(tx);
      return objectivesRepository.create({ workspaceId: actor.workspaceId, strategyId: strategy.id, description });
    });
  }

  async listarObjetivos(
    actor: Pick<ActorContext, 'workspaceId'>,
    strategyId: string,
  ): Promise<PaginatedResult<StrategyObjective>> {
    await this.obterEstrategia(actor, strategyId);
    const objectivesRepository = new StrategyObjectivesRepository(this.db);
    return objectivesRepository.findByStrategy(actor.workspaceId, strategyId);
  }

  /**
   * ADR-004: capacidade de domínio da Estratégia — garante que a Estratégia
   * identificada por `strategyId` existe neste Workspace e está `ativa`,
   * lançando `EstrategiaEncerradaError`/`NaoEncontradoError` quando não.
   * Contrato reutilizável por qualquer Service que precise dessa garantia
   * como precondição antes de escrever algo subordinado a uma Estratégia
   * (Campanha, Tática, Ação, Objetivo etc.) — não é específico de nenhum
   * módulo consumidor. Delega para a mesma checagem já usada internamente
   * pela formulação, sem duplicá-la.
   */
  async garantirEstrategiaAtiva(
    actor: Pick<ActorContext, 'workspaceId'>,
    strategyId: string,
    dbClient: DbClient = this.db,
  ): Promise<Strategy> {
    return this.obterEstrategiaAtivaObrigatoria(actor, strategyId, dbClient);
  }

  private async buscarAtivaInterno(
    strategiesRepository: StrategiesRepository,
    workspaceId: string,
  ): Promise<Strategy | undefined> {
    const { items } = await strategiesRepository.findByWorkspace(workspaceId, { limit: 100 });
    return items.find((strategy) => strategy.status === 'ativa');
  }

  private async buscarEtapa(
    stepsRepository: StrategyStepsRepository,
    workspaceId: string,
    strategyId: string,
    stepType: StepType,
  ): Promise<StrategyStep | undefined> {
    const { items } = await stepsRepository.findByStrategy(workspaceId, strategyId, { limit: 20 });
    return items.find((step) => step.stepType === stepType);
  }

  /** ADR-004 (aplicado por extensão): a formulação de uma Estratégia encerrada não aceita nova edição. */
  private async obterEstrategiaAtivaObrigatoria(
    actor: Pick<ActorContext, 'workspaceId'>,
    strategyId: string,
    dbClient: DbClient = this.db,
  ): Promise<Strategy> {
    const strategy = await this.obterEstrategia(actor, strategyId, dbClient);
    if (strategy.status !== 'ativa') {
      throw new EstrategiaEncerradaError(strategyId);
    }
    return strategy;
  }

  /**
   * ADR-014/A4: revalida `actor.memberId` contra a linha real de `members`
   * dentro da mesma transação da escrita — nunca confia apenas no `role` que
   * chegou em `ActorContext`, mesmo já tendo passado por `assertAdmin`.
   */
  private async assertAindaAdmin(actor: ActorContext, dbClient: DbClient): Promise<void> {
    const membersRepository = this.membersRepositoryFactory(dbClient);
    const membro = await membersRepository.findById(actor.workspaceId, actor.memberId);
    if (!membro || membro.status !== 'ativo' || membro.role !== 'admin') {
      throw new AutorizacaoInsuficienteError('aprovar etapa da formulação', 'admin');
    }
  }
}
