/**
 * GrowthService — RFC-003 (Growth), RFC-004 (máquina de estados de Hipótese
 * e Experimento). A verificação dupla da amarração de Experimento e a
 * transição acoplada de Hipótese (na aprovação e na conclusão) são parte da
 * própria especificação de RFC-003, não uma decisão arquitetural separada.
 *
 * Um único Service para Hipótese e Experimento — RFC-003 os trata como um
 * domínio único e as transições são acopladas (aprovar Experimento *é*
 * transicionar a Hipótese, não duas operações independentes coordenadas de
 * fora). Não inclui Aprendizado: RFC-005 é a autoridade única sobre essa
 * entidade (ver `docs/rfc/RFC-003-growth.md`, "Fronteira com Aprendizado") —
 * `concluirExperimento` produz a Evidência e a interpretação (Validada/
 * Refutada), mas o registro de Aprendizado em si é responsabilidade de um
 * `AprendizadoService` futuro, fora do escopo desta implementação.
 *
 * ADR-012: `aprovarExperimento` é a única operação deste Service que exige
 * `role = 'admin'` — todas as demais (registrar/priorizar Hipótese, propor
 * Experimento, iniciar execução, concluir) são permitidas a qualquer Membro
 * `ativo`, mesmo padrão de `ExecucaoService`.
 */
import {
  EvidencesRepository,
  ExperimentsRepository,
  HypothesesRepository,
  StrategyObjectivesRepository,
  TacticsRepository,
  ActionsRepository,
  type DbClient,
  type Evidence,
  type Experiment,
  type Hypothesis,
  type ListOptions,
  type PaginatedResult,
} from '@vektor/db';
import { assertAdmin, type ActorContext } from '../shared/actor-context';
import {
  AutorizacaoInsuficienteError,
  HipoteseNaoPriorizadaError,
  NaoEncontradoError,
  TransicaoConcorrenteError,
} from '../shared/errors';
import type { MembersRepositoryFactory } from '../shared/ports';
import type { EstrategiaService } from '../estrategia/estrategia.service';

export interface RegistrarHipoteseInput {
  description: string;
}

/**
 * Posse polimórfica (Tática XOR Ação, `experiments_exactly_one_owner_check`)
 * — mesma técnica de `NewExperiment`/`NewEvidence` em `@vektor/db`.
 */
export type ProporExperimentoInput =
  | { hypothesisId: string; objectiveId: string; tacticId: string; actionId?: undefined }
  | { hypothesisId: string; objectiveId: string; actionId: string; tacticId?: undefined };

export interface ConcluirExperimentoInput {
  content: unknown;
  /** RFC-004: quem decide é sempre humano (AQ-002) — nunca inferido automaticamente pelo Service. */
  resultado: 'validada' | 'refutada';
}

export class GrowthService {
  constructor(
    private readonly db: DbClient,
    private readonly estrategiaService: EstrategiaService,
    private readonly membersRepositoryFactory: MembersRepositoryFactory,
  ) {}

  /** RFC-003 critério nº1: Hipótese nunca existe sem a Evidência que a originou. */
  async registrarHipotese(
    actor: Pick<ActorContext, 'workspaceId' | 'memberId'>,
    evidenceId: string,
    input: RegistrarHipoteseInput,
  ): Promise<Hypothesis> {
    return this.db.transaction(async (tx) => {
      const evidencesRepository = new EvidencesRepository(tx);
      const evidence = await evidencesRepository.findById(actor.workspaceId, evidenceId);
      if (!evidence) {
        throw new NaoEncontradoError('Evidência', evidenceId);
      }
      const hypothesesRepository = new HypothesesRepository(tx);
      return hypothesesRepository.create({
        workspaceId: actor.workspaceId,
        evidenceId: evidence.id,
        description: input.description,
        createdBy: actor.memberId,
      });
    });
  }

  async listarHipoteses(
    actor: Pick<ActorContext, 'workspaceId'>,
    evidenceId?: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<Hypothesis>> {
    const hypothesesRepository = new HypothesesRepository(this.db);
    if (evidenceId) {
      return hypothesesRepository.findByEvidence(actor.workspaceId, evidenceId, options);
    }
    return hypothesesRepository.findByWorkspace(actor.workspaceId, options);
  }

  async obterHipotese(
    actor: Pick<ActorContext, 'workspaceId'>,
    hypothesisId: string,
    dbClient: DbClient = this.db,
  ): Promise<Hypothesis> {
    const hypothesesRepository = new HypothesesRepository(dbClient);
    const hypothesis = await hypothesesRepository.findById(actor.workspaceId, hypothesisId);
    if (!hypothesis) {
      throw new NaoEncontradoError('Hipótese', hypothesisId);
    }
    return hypothesis;
  }

  /** RFC-004: Registrada → Priorizada. ADR-012 por analogia (AQ-003): qualquer Membro ativo. */
  async priorizarHipotese(actor: Pick<ActorContext, 'workspaceId'>, hypothesisId: string): Promise<Hypothesis> {
    return this.db.transaction(async (tx) => {
      const hypothesesRepository = new HypothesesRepository(tx);
      const priorizada = await hypothesesRepository.update(
        actor.workspaceId,
        hypothesisId,
        { status: 'priorizada' },
        'registrada',
      );
      if (!priorizada) {
        throw new TransicaoConcorrenteError('Hipótese', hypothesisId);
      }
      return priorizada;
    });
  }

  /**
   * RFC-003 critério nº2: declara Hipótese e Objetivo (1ª verificação da
   * dupla amarração): o Objetivo precisa pertencer a uma Estratégia ativa já
   * na proposta, mesmo padrão de `ExecucaoService.criarX` via
   * `garantirEstrategiaAtiva`.
   */
  async proporExperimento(
    actor: Pick<ActorContext, 'workspaceId'>,
    input: ProporExperimentoInput,
  ): Promise<Experiment> {
    return this.db.transaction(async (tx) => {
      await this.obterHipotese(actor, input.hypothesisId, tx);

      const objectivesRepository = new StrategyObjectivesRepository(tx);
      const objective = await objectivesRepository.findById(actor.workspaceId, input.objectiveId);
      if (!objective) {
        throw new NaoEncontradoError('Objetivo', input.objectiveId);
      }
      await this.estrategiaService.garantirEstrategiaAtiva(actor, objective.strategyId, tx);

      if (input.tacticId) {
        const tacticsRepository = new TacticsRepository(tx);
        const tactic = await tacticsRepository.findById(actor.workspaceId, input.tacticId);
        if (!tactic) {
          throw new NaoEncontradoError('Tática', input.tacticId);
        }
      } else {
        const actionId = input.actionId as string;
        const actionsRepository = new ActionsRepository(tx);
        const action = await actionsRepository.findById(actor.workspaceId, actionId);
        if (!action) {
          throw new NaoEncontradoError('Ação', actionId);
        }
      }

      const experimentsRepository = new ExperimentsRepository(tx);
      return experimentsRepository.create({
        workspaceId: actor.workspaceId,
        hypothesisId: input.hypothesisId,
        objectiveId: input.objectiveId,
        tacticId: input.tacticId,
        actionId: input.actionId,
      } as Parameters<ExperimentsRepository['create']>[0]);
    });
  }

  async listarExperimentos(
    actor: Pick<ActorContext, 'workspaceId'>,
    hypothesisId?: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<Experiment>> {
    const experimentsRepository = new ExperimentsRepository(this.db);
    if (hypothesisId) {
      return experimentsRepository.findByHypothesis(actor.workspaceId, hypothesisId, options);
    }
    return experimentsRepository.findByWorkspace(actor.workspaceId, options);
  }

  async obterExperimento(
    actor: Pick<ActorContext, 'workspaceId'>,
    experimentId: string,
    dbClient: DbClient = this.db,
  ): Promise<Experiment> {
    const experimentsRepository = new ExperimentsRepository(dbClient);
    const experiment = await experimentsRepository.findById(actor.workspaceId, experimentId);
    if (!experiment) {
      throw new NaoEncontradoError('Experimento', experimentId);
    }
    return experiment;
  }

  /**
   * RFC-004: Proposto → Aprovado. ADR-012: exige `role = 'admin'` (fecha
   * Bloqueador 3). 2ª verificação da dupla amarração: revalida a
   * Estratégia ativa aqui, independente da checagem já feita em
   * `proporExperimento` — o intervalo entre propor e aprovar é exatamente a
   * janela em que uma Estratégia pode encerrar. Também transiciona a
   * Hipótese associada (`priorizada → em_teste`) na mesma transação —
   * RFC-004: "Priorizada → EmTeste: Experimento aprovado para rodar".
   */
  async aprovarExperimento(actor: ActorContext, experimentId: string): Promise<Experiment> {
    assertAdmin(actor, 'aprovar Experimento');

    return this.db.transaction(async (tx) => {
      await this.assertAindaAdmin(actor, tx);

      const experiment = await this.obterExperimento(actor, experimentId, tx);
      const objectivesRepository = new StrategyObjectivesRepository(tx);
      const objective = await objectivesRepository.findById(actor.workspaceId, experiment.objectiveId);
      if (!objective) {
        throw new NaoEncontradoError('Objetivo', experiment.objectiveId);
      }
      await this.estrategiaService.garantirEstrategiaAtiva(actor, objective.strategyId, tx);

      const hypothesesRepository = new HypothesesRepository(tx);
      const hypothesis = await hypothesesRepository.findById(actor.workspaceId, experiment.hypothesisId);
      if (!hypothesis || hypothesis.status !== 'priorizada') {
        throw new HipoteseNaoPriorizadaError(experiment.hypothesisId);
      }

      const experimentsRepository = new ExperimentsRepository(tx);
      const aprovado = await experimentsRepository.update(
        actor.workspaceId,
        experimentId,
        { approvedBy: actor.memberId, approvedAt: new Date(), status: 'aprovado' },
        'proposto',
      );
      if (!aprovado) {
        throw new TransicaoConcorrenteError('Experimento', experimentId);
      }

      const hipoteseEmTeste = await hypothesesRepository.update(
        actor.workspaceId,
        hypothesis.id,
        { status: 'em_teste' },
        'priorizada',
      );
      if (!hipoteseEmTeste) {
        throw new TransicaoConcorrenteError('Hipótese', hypothesis.id);
      }

      return aprovado;
    });
  }

  /** RFC-004: Aprovado → Em execução. Mesmo padrão de `ExecucaoService.iniciarExecucaoAcao`. */
  async iniciarExecucaoExperimento(
    actor: Pick<ActorContext, 'workspaceId'>,
    experimentId: string,
  ): Promise<Experiment> {
    return this.db.transaction(async (tx) => {
      const experimentsRepository = new ExperimentsRepository(tx);
      const emExecucao = await experimentsRepository.update(
        actor.workspaceId,
        experimentId,
        { status: 'em_execucao' },
        'aprovado',
      );
      if (!emExecucao) {
        throw new TransicaoConcorrenteError('Experimento', experimentId);
      }
      return emExecucao;
    });
  }

  /**
   * RFC-004: Em execução → Concluído. RFC-002 critério nº5 (estendido a
   * Experimento): a conclusão sempre produz uma Evidência, na mesma
   * transação. Também transiciona a Hipótese (`em_teste → validada/
   * refutada`, conforme `input.resultado`) — RFC-004: "EmTeste → Validada/
   * Refutada: Experimento confirma/não confirma a Hipótese". `resultado` é
   * sempre informado explicitamente pelo chamador humano (AQ-002; RFC-003,
   * "Onde a IA nunca toma decisões") — este Service nunca o infere.
   */
  async concluirExperimento(
    actor: Pick<ActorContext, 'workspaceId'>,
    experimentId: string,
    input: ConcluirExperimentoInput,
  ): Promise<{ experiment: Experiment; evidence: Evidence }> {
    return this.db.transaction(async (tx) => {
      const experimentsRepository = new ExperimentsRepository(tx);
      const concluido = await experimentsRepository.update(
        actor.workspaceId,
        experimentId,
        { status: 'concluido' },
        'em_execucao',
      );
      if (!concluido) {
        throw new TransicaoConcorrenteError('Experimento', experimentId);
      }

      const evidencesRepository = new EvidencesRepository(tx);
      const evidence = await evidencesRepository.create({
        workspaceId: actor.workspaceId,
        experimentId: concluido.id,
        content: input.content,
      });

      const hypothesesRepository = new HypothesesRepository(tx);
      const hipoteseFinal = await hypothesesRepository.update(
        actor.workspaceId,
        concluido.hypothesisId,
        { status: input.resultado },
        'em_teste',
      );
      if (!hipoteseFinal) {
        throw new TransicaoConcorrenteError('Hipótese', concluido.hypothesisId);
      }

      return { experiment: concluido, evidence };
    });
  }

  /**
   * ADR-014/A4: revalida `actor.memberId` contra a linha real de `members`
   * dentro da mesma transação da escrita — mesmo padrão de
   * `EstrategiaService.assertAindaAdmin`.
   */
  private async assertAindaAdmin(actor: ActorContext, dbClient: DbClient): Promise<void> {
    const membersRepository = this.membersRepositoryFactory(dbClient);
    const membro = await membersRepository.findById(actor.workspaceId, actor.memberId);
    if (!membro || membro.status !== 'ativo' || membro.role !== 'admin') {
      throw new AutorizacaoInsuficienteError('aprovar Experimento', 'admin');
    }
  }
}
