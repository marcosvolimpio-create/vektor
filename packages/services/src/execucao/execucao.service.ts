/**
 * ExecucaoService — RFC-002 (Execução), RFC-004 (máquina de estados de Ação).
 *
 * ADR-012: nenhuma operação deste Service exige `role = 'admin'` — criar e
 * aprovar Campanha/Tática/Ação é permitido a qualquer Membro `ativo`, papel
 * já garantido pela própria existência de um `ActorContext` (resolvido por
 * `resolveRequestActorContext` antes de qualquer Service ser chamado). Por
 * isso este Service, ao contrário de `EstrategiaService`/`ConfiguracoesService`,
 * não depende de `MembersRepositoryFactory` — não há nenhuma checagem de
 * `role` a fazer.
 *
 * Toda validação de "a Estratégia-alvo existe e está ativa" (ADR-004,
 * RFC-002 critério nº1) é delegada a `EstrategiaService.garantirEstrategiaAtiva`
 * — nunca duplicada aqui nem lida diretamente de `StrategiesRepository`.
 */
import {
  ActionsRepository,
  CampaignsRepository,
  EvidencesRepository,
  TacticsRepository,
  type Action,
  type ActionStatus,
  type Campaign,
  type DbClient,
  type Evidence,
  type ListOptions,
  type PaginatedResult,
  type Tactic,
} from '@vektor/db';
import type { ActorContext } from '../shared/actor-context';
import { AcaoNaoIniciadaError, NaoEncontradoError, TransicaoConcorrenteError } from '../shared/errors';
import type { EstrategiaService } from '../estrategia/estrategia.service';

export interface CriarCampanhaInput {
  name: string;
  description?: string;
}

export interface CriarTaticaInput {
  name: string;
  description?: string;
}

export interface CriarAcaoInput {
  name: string;
  description?: string;
}

export interface ConcluirAcaoInput {
  content: unknown;
  publicar?: boolean;
}

export interface RegistrarEvidenciaInput {
  content: unknown;
}

/**
 * RFC-002 (evolução aprovada — módulo Evidências): uma Ação só produz algo
 * observável a partir do momento em que começa a ser executada. `proposta`/
 * `aprovada` ficam de fora; `concluida`/`publicada` continuam aceitando
 * novo registro porque a tabela é multi-linha por design (append-only).
 */
const STATUSES_COM_EVIDENCIA_PERMITIDA: readonly ActionStatus[] = ['em_execucao', 'concluida', 'publicada'];

export class ExecucaoService {
  constructor(
    private readonly db: DbClient,
    private readonly estrategiaService: EstrategiaService,
  ) {}

  /** RFC-002 critério nº1: só cria Campanha dentro de uma Estratégia ativa (ADR-004). */
  async criarCampanha(actor: ActorContext, strategyId: string, input: CriarCampanhaInput): Promise<Campaign> {
    return this.db.transaction(async (tx) => {
      const strategy = await this.estrategiaService.garantirEstrategiaAtiva(actor, strategyId, tx);
      const campaignsRepository = new CampaignsRepository(tx);
      return campaignsRepository.create({
        workspaceId: actor.workspaceId,
        strategyId: strategy.id,
        name: input.name,
        description: input.description ?? null,
        // B16 (ARCHITECTURE_RESOLUTION.md): Fase 2 só implementa criação manual —
        // handoff automático a partir da síntese de Estratégia permanece bloqueado.
        origin: 'manual',
        createdBy: actor.memberId,
      });
    });
  }

  async listarCampanhas(
    actor: Pick<ActorContext, 'workspaceId'>,
    strategyId?: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<Campaign>> {
    const campaignsRepository = new CampaignsRepository(this.db);
    if (strategyId) {
      return campaignsRepository.findByStrategy(actor.workspaceId, strategyId, options);
    }
    return campaignsRepository.findByWorkspace(actor.workspaceId, options);
  }

  async obterCampanha(
    actor: Pick<ActorContext, 'workspaceId'>,
    campaignId: string,
    dbClient: DbClient = this.db,
  ): Promise<Campaign> {
    const campaignsRepository = new CampaignsRepository(dbClient);
    const campaign = await campaignsRepository.findById(actor.workspaceId, campaignId);
    if (!campaign) {
      throw new NaoEncontradoError('Campanha', campaignId);
    }
    return campaign;
  }

  /** RFC-002 critério nº1: a Estratégia dona da Campanha precisa continuar ativa. */
  async criarTatica(actor: ActorContext, campaignId: string, input: CriarTaticaInput): Promise<Tactic> {
    return this.db.transaction(async (tx) => {
      const campaign = await this.obterCampanha(actor, campaignId, tx);
      await this.estrategiaService.garantirEstrategiaAtiva(actor, campaign.strategyId, tx);
      const tacticsRepository = new TacticsRepository(tx);
      return tacticsRepository.create({
        workspaceId: actor.workspaceId,
        campaignId: campaign.id,
        name: input.name,
        description: input.description ?? null,
        createdBy: actor.memberId,
      });
    });
  }

  async listarTaticas(
    actor: Pick<ActorContext, 'workspaceId'>,
    campaignId?: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<Tactic>> {
    const tacticsRepository = new TacticsRepository(this.db);
    if (campaignId) {
      return tacticsRepository.findByCampaign(actor.workspaceId, campaignId, options);
    }
    return tacticsRepository.findByWorkspace(actor.workspaceId, options);
  }

  async obterTatica(
    actor: Pick<ActorContext, 'workspaceId'>,
    tacticId: string,
    dbClient: DbClient = this.db,
  ): Promise<Tactic> {
    const tacticsRepository = new TacticsRepository(dbClient);
    const tactic = await tacticsRepository.findById(actor.workspaceId, tacticId);
    if (!tactic) {
      throw new NaoEncontradoError('Tática', tacticId);
    }
    return tactic;
  }

  /** RFC-002 critério nº1: a Estratégia dona da Campanha/Tática precisa continuar ativa. */
  async criarAcao(actor: ActorContext, tacticId: string, input: CriarAcaoInput): Promise<Action> {
    return this.db.transaction(async (tx) => {
      const tactic = await this.obterTatica(actor, tacticId, tx);
      const campaign = await this.obterCampanha(actor, tactic.campaignId, tx);
      await this.estrategiaService.garantirEstrategiaAtiva(actor, campaign.strategyId, tx);
      const actionsRepository = new ActionsRepository(tx);
      return actionsRepository.create({
        workspaceId: actor.workspaceId,
        tacticId: tactic.id,
        name: input.name,
        description: input.description ?? null,
      });
    });
  }

  async listarAcoes(
    actor: Pick<ActorContext, 'workspaceId'>,
    tacticId?: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<Action>> {
    const actionsRepository = new ActionsRepository(this.db);
    if (tacticId) {
      return actionsRepository.findByTactic(actor.workspaceId, tacticId, options);
    }
    return actionsRepository.findByWorkspace(actor.workspaceId, options);
  }

  async obterAcao(
    actor: Pick<ActorContext, 'workspaceId'>,
    actionId: string,
    dbClient: DbClient = this.db,
  ): Promise<Action> {
    const actionsRepository = new ActionsRepository(dbClient);
    const action = await actionsRepository.findById(actor.workspaceId, actionId);
    if (!action) {
      throw new NaoEncontradoError('Ação', actionId);
    }
    return action;
  }

  /** RFC-004: Proposta → Aprovada. ADR-012: qualquer Membro ativo, sem exigir `admin`. */
  async aprovarAcao(actor: ActorContext, actionId: string): Promise<Action> {
    return this.db.transaction(async (tx) => {
      const actionsRepository = new ActionsRepository(tx);
      const aprovada = await actionsRepository.update(
        actor.workspaceId,
        actionId,
        { status: 'aprovada', approvedBy: actor.memberId, approvedAt: new Date() },
        'proposta',
      );
      if (!aprovada) {
        throw new TransicaoConcorrenteError('Ação', actionId);
      }
      return aprovada;
    });
  }

  /** RFC-004: Aprovada → Em execução. */
  async iniciarExecucaoAcao(actor: Pick<ActorContext, 'workspaceId'>, actionId: string): Promise<Action> {
    return this.db.transaction(async (tx) => {
      const actionsRepository = new ActionsRepository(tx);
      const emExecucao = await actionsRepository.update(actor.workspaceId, actionId, { status: 'em_execucao' }, 'aprovada');
      if (!emExecucao) {
        throw new TransicaoConcorrenteError('Ação', actionId);
      }
      return emExecucao;
    });
  }

  /**
   * RFC-004: Em execução → Concluída ou Publicada. RFC-002 critério nº5: a
   * conclusão de uma Ação sempre produz uma Evidência, na mesma transação —
   * nunca uma Ação "concluída" sem o registro correspondente do que aconteceu.
   */
  async concluirAcao(actor: Pick<ActorContext, 'workspaceId'>, actionId: string, input: ConcluirAcaoInput): Promise<Action> {
    return this.db.transaction(async (tx) => {
      const actionsRepository = new ActionsRepository(tx);
      const concluida = await actionsRepository.update(
        actor.workspaceId,
        actionId,
        { status: input.publicar ? 'publicada' : 'concluida', completedAt: new Date() },
        'em_execucao',
      );
      if (!concluida) {
        throw new TransicaoConcorrenteError('Ação', actionId);
      }
      const evidencesRepository = new EvidencesRepository(tx);
      await evidencesRepository.create({
        workspaceId: actor.workspaceId,
        actionId: concluida.id,
        content: input.content,
      });
      return concluida;
    });
  }

  /**
   * Registro de Evidência independente da conclusão da Ação — distinto do
   * registro automático dentro de `concluirAcao` (RFC-002 crit. nº5), que
   * permanece inalterado. Não transiciona `status`; só valida que a Ação já
   * começou a ser executada antes de gravar.
   */
  async registrarEvidencia(
    actor: Pick<ActorContext, 'workspaceId'>,
    actionId: string,
    input: RegistrarEvidenciaInput,
  ): Promise<Evidence> {
    return this.db.transaction(async (tx) => {
      const acao = await this.obterAcao(actor, actionId, tx);
      if (!STATUSES_COM_EVIDENCIA_PERMITIDA.includes(acao.status)) {
        throw new AcaoNaoIniciadaError(actionId);
      }
      const evidencesRepository = new EvidencesRepository(tx);
      return evidencesRepository.create({
        workspaceId: actor.workspaceId,
        actionId: acao.id,
        content: input.content,
      });
    });
  }

  async obterEvidencia(
    actor: Pick<ActorContext, 'workspaceId'>,
    evidenceId: string,
    dbClient: DbClient = this.db,
  ): Promise<Evidence> {
    const evidencesRepository = new EvidencesRepository(dbClient);
    const evidence = await evidencesRepository.findById(actor.workspaceId, evidenceId);
    if (!evidence) {
      throw new NaoEncontradoError('Evidência', evidenceId);
    }
    return evidence;
  }

  async listarEvidencias(
    actor: Pick<ActorContext, 'workspaceId'>,
    actionId?: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<Evidence>> {
    const evidencesRepository = new EvidencesRepository(this.db);
    if (actionId) {
      return evidencesRepository.findByAction(actor.workspaceId, actionId, options);
    }
    return evidencesRepository.findByWorkspace(actor.workspaceId, options);
  }
}
