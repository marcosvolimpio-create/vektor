/**
 * ExecutionIntelligenceService — Sprint 4 (Execução Inteligente).
 *
 * Responsabilidades separadas por método, seguindo o mesmo padrão de
 * `GrowthService`/`ExecucaoService` (um Service por módulo, responsabilidades
 * divididas em métodos — não em classes separadas por verbo, para não
 * introduzir um padrão arquitetural novo que não existe em nenhum outro
 * módulo): `construirContexto` (análise/montagem do DTO), `analisarExecucao`
 * (geração + persistência de recomendações, com deduplicação),
 * `listarRecomendacoes` (leitura), `aceitarRecomendacao`/`descartarRecomendacao`
 * (aprovação/descarte). Nenhuma recomendação altera Campaigns/Tactics/
 * Actions/Evidences/Objectives/Experiments — só lê essas tabelas.
 *
 * ADR-012: nenhuma operação aqui exige `role = 'admin'` — mesmo raciocínio
 * de `ExecucaoService` (ver seu próprio comentário de topo): a resolução de
 * `ActorContext` já garante Membro `ativo`, e aceitar/descartar uma
 * recomendação não é uma decisão de negócio irreversível sobre o domínio.
 */
import {
  ActionsRepository,
  CampaignsRepository,
  EvidencesRepository,
  ExecutionRecommendationsRepository,
  ExperimentsRepository,
  HypothesesRepository,
  StrategyObjectivesRepository,
  TacticsRepository,
  type DbClient,
  type ExecutionRecommendation,
} from '@vektor/db';
import type { EstrategiaService } from '../estrategia/estrategia.service';
import type { ActorContext } from '../shared/actor-context';
import { NaoEncontradoError, TransicaoConcorrenteError } from '../shared/errors';
import type {
  ActionContextItem,
  CampaignContextItem,
  ExecutionContext,
  ObjectiveContextItem,
  TacticContextItem,
} from './execution-context';
import type { ExecutionAdvisorAI } from './ports';

const LIMITE_LISTAGEM = 100;

export class ExecutionIntelligenceService {
  constructor(
    private readonly db: DbClient,
    private readonly estrategiaService: EstrategiaService,
    private readonly advisor: ExecutionAdvisorAI,
  ) {}

  /** Monta o `ExecutionContext` a partir dos Repositories já existentes — nenhuma tabela nova é lida além de `execution_recommendations`. */
  private async construirContexto(
    actor: ActorContext,
    strategyId: string,
    tx: DbClient,
  ): Promise<ExecutionContext> {
    const strategy = await this.estrategiaService.garantirEstrategiaAtiva(actor, strategyId, tx);

    const objectivesRepository = new StrategyObjectivesRepository(tx);
    const campaignsRepository = new CampaignsRepository(tx);
    const tacticsRepository = new TacticsRepository(tx);
    const actionsRepository = new ActionsRepository(tx);
    const evidencesRepository = new EvidencesRepository(tx);
    const experimentsRepository = new ExperimentsRepository(tx);
    const hypothesesRepository = new HypothesesRepository(tx);

    const objectivesResult = await objectivesRepository.findByStrategy(actor.workspaceId, strategyId, {
      limit: LIMITE_LISTAGEM,
    });
    const objectives: ObjectiveContextItem[] = await Promise.all(
      objectivesResult.items.map(async (objective) => {
        const experiments = await experimentsRepository.findByObjective(actor.workspaceId, objective.id, {
          limit: 1,
        });
        return { id: objective.id, description: objective.description, experimentCount: experiments.total };
      }),
    );

    const campaignsResult = await campaignsRepository.findByStrategy(actor.workspaceId, strategyId, {
      limit: LIMITE_LISTAGEM,
    });
    const campaigns: CampaignContextItem[] = await Promise.all(
      campaignsResult.items.map(async (campaign) => {
        const tacticsResult = await tacticsRepository.findByCampaign(actor.workspaceId, campaign.id, {
          limit: LIMITE_LISTAGEM,
        });
        const tactics: TacticContextItem[] = await Promise.all(
          tacticsResult.items.map(async (tactic) => {
            const actionsResult = await actionsRepository.findByTactic(actor.workspaceId, tactic.id, {
              limit: LIMITE_LISTAGEM,
            });
            const actions: ActionContextItem[] = await Promise.all(
              actionsResult.items.map(async (action) => {
                const evidencesResult = await evidencesRepository.findByAction(actor.workspaceId, action.id, {
                  limit: LIMITE_LISTAGEM,
                });
                let hasRefutedHypothesis = false;
                for (const evidence of evidencesResult.items) {
                  const hypothesesResult = await hypothesesRepository.findByEvidence(
                    actor.workspaceId,
                    evidence.id,
                    { limit: 1 },
                  );
                  if (hypothesesResult.items.some((hypothesis) => hypothesis.status === 'refutada')) {
                    hasRefutedHypothesis = true;
                    break;
                  }
                }
                return {
                  id: action.id,
                  name: action.name,
                  status: action.status,
                  createdAt: action.createdAt,
                  evidenceCount: evidencesResult.total,
                  hasRefutedHypothesis,
                };
              }),
            );
            return { id: tactic.id, name: tactic.name, actions };
          }),
        );
        return { id: campaign.id, name: campaign.name, createdAt: campaign.createdAt, tactics };
      }),
    );

    return {
      strategy: { id: strategy.id, status: strategy.status, createdAt: strategy.createdAt },
      objectives,
      campaigns,
      kpis: [],
      generatedAt: new Date(),
    };
  }

  /**
   * Roda o motor de análise + IA, persiste só as recomendações que ainda
   * não existem como `pendente` para a mesma causa (`dedupeKey`), e retorna
   * a lista atual completa. Nunca escreve em nenhuma tabela além de
   * `execution_recommendations`.
   */
  async analisarExecucao(actor: ActorContext, strategyId: string): Promise<ExecutionRecommendation[]> {
    return this.db.transaction(async (tx) => {
      const context = await this.construirContexto(actor, strategyId, tx);
      const drafts = this.advisor.gerarRecomendacoes(context);

      const repository = new ExecutionRecommendationsRepository(tx);
      for (const draft of drafts) {
        const existente = await repository.findPendingByDedupeKey(actor.workspaceId, draft.dedupeKey);
        if (existente) {
          continue;
        }
        await repository.create({
          workspaceId: actor.workspaceId,
          strategyId,
          type: draft.type,
          priority: draft.priority,
          justification: draft.justification,
          context: draft.context,
          suggestedAction: draft.suggestedAction,
          dedupeKey: draft.dedupeKey,
        });
      }

      const result = await repository.findByStrategy(actor.workspaceId, strategyId, { limit: LIMITE_LISTAGEM });
      return result.items;
    });
  }

  /** Só lê — não roda o motor de análise novamente. */
  async listarRecomendacoes(actor: ActorContext, strategyId: string): Promise<ExecutionRecommendation[]> {
    const repository = new ExecutionRecommendationsRepository(this.db);
    const result = await repository.findByStrategy(actor.workspaceId, strategyId, { limit: LIMITE_LISTAGEM });
    return result.items;
  }

  /** Pendente → Aceita. Não dispara nenhuma execução automática (escopo desta Sprint proíbe). */
  async aceitarRecomendacao(actor: ActorContext, recommendationId: string): Promise<ExecutionRecommendation> {
    return this.transicionar(actor, recommendationId, 'aceita');
  }

  /** Pendente → Descartada. */
  async descartarRecomendacao(actor: ActorContext, recommendationId: string): Promise<ExecutionRecommendation> {
    return this.transicionar(actor, recommendationId, 'descartada');
  }

  private async transicionar(
    actor: ActorContext,
    recommendationId: string,
    novoStatus: 'aceita' | 'descartada',
  ): Promise<ExecutionRecommendation> {
    return this.db.transaction(async (tx) => {
      const repository = new ExecutionRecommendationsRepository(tx);
      const atual = await repository.findById(actor.workspaceId, recommendationId);
      if (!atual) {
        throw new NaoEncontradoError('Recomendação', recommendationId);
      }
      const atualizado = await repository.update(
        actor.workspaceId,
        recommendationId,
        { status: novoStatus, updatedAt: new Date() },
        'pendente',
      );
      if (!atualizado) {
        throw new TransicaoConcorrenteError('Recomendação', recommendationId);
      }
      return atualizado;
    });
  }
}
