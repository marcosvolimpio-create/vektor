'use server';

import type { DbClient, ExecutionRecommendation } from '@vektor/db';
import type { ActorContext } from '@vektor/services';
import { getAuthenticatedUser } from '../server/auth';
import {
  createExecutionIntelligenceService,
  resolveRequestActorContext,
  runInRequestContext,
} from '../server/composition-root';

/** Abre a transação da requisição (ADR-014) e resolve o `ActorContext` dentro dela — mesmo padrão de `execucao.actions.ts`. */
async function withActor<T>(
  workspaceId: string,
  callback: (tx: DbClient, actor: ActorContext) => Promise<T>,
): Promise<T> {
  const { userId } = await getAuthenticatedUser();
  return runInRequestContext(userId, async (tx) => {
    const actor = await resolveRequestActorContext(tx, userId, workspaceId);
    return callback(tx, actor);
  });
}

/** Roda o motor de análise + IA e persiste só as recomendações novas (deduplicadas). */
export async function analisarExecucaoAction(
  workspaceId: string,
  strategyId: string,
): Promise<ExecutionRecommendation[]> {
  return withActor(workspaceId, (tx, actor) =>
    createExecutionIntelligenceService(tx).analisarExecucao(actor, strategyId),
  );
}

export async function listarRecomendacoesAction(
  workspaceId: string,
  strategyId: string,
): Promise<ExecutionRecommendation[]> {
  return withActor(workspaceId, (tx, actor) =>
    createExecutionIntelligenceService(tx).listarRecomendacoes(actor, strategyId),
  );
}

export async function aceitarRecomendacaoAction(
  workspaceId: string,
  recommendationId: string,
): Promise<ExecutionRecommendation> {
  return withActor(workspaceId, (tx, actor) =>
    createExecutionIntelligenceService(tx).aceitarRecomendacao(actor, recommendationId),
  );
}

export async function descartarRecomendacaoAction(
  workspaceId: string,
  recommendationId: string,
): Promise<ExecutionRecommendation> {
  return withActor(workspaceId, (tx, actor) =>
    createExecutionIntelligenceService(tx).descartarRecomendacao(actor, recommendationId),
  );
}
