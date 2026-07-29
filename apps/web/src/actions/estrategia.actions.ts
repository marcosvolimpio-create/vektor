'use server';

import type { DbClient, ListOptions, PaginatedResult, Strategy, StrategyObjective, StrategyStep } from '@vektor/db';
import type { ActorContext, StepType } from '@vektor/services';
import { getAuthenticatedUser } from '../server/auth';
import { createEstrategiaService, resolveRequestActorContext, runInRequestContext } from '../server/composition-root';

/** Abre a transação da requisição (ADR-014) e resolve o `ActorContext` dentro dela. */
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

export async function iniciarFormulacaoAction(
  workspaceId: string,
  evolvedFromStrategyId?: string,
): Promise<Strategy> {
  return withActor(workspaceId, (tx, actor) =>
    createEstrategiaService(tx).iniciarFormulacao(actor, { evolvedFromStrategyId }),
  );
}

export async function obterEstrategiaAtivaAction(workspaceId: string): Promise<Strategy | null> {
  return withActor(workspaceId, (tx, actor) => createEstrategiaService(tx).obterEstrategiaAtiva(actor));
}

export async function obterEstrategiaAction(workspaceId: string, strategyId: string): Promise<Strategy> {
  return withActor(workspaceId, (tx, actor) => createEstrategiaService(tx).obterEstrategia(actor, strategyId));
}

export async function listarEstrategiasAction(
  workspaceId: string,
  options?: ListOptions,
): Promise<PaginatedResult<Strategy>> {
  return withActor(workspaceId, (tx, actor) => createEstrategiaService(tx).listarEstrategias(actor, options));
}

export async function listarEtapasAction(
  workspaceId: string,
  strategyId: string,
): Promise<PaginatedResult<StrategyStep>> {
  return withActor(workspaceId, (tx, actor) => createEstrategiaService(tx).listarEtapas(actor, strategyId));
}

export async function preencherEtapaAction(
  workspaceId: string,
  strategyId: string,
  stepType: StepType,
  content: unknown,
): Promise<StrategyStep> {
  return withActor(workspaceId, (tx, actor) =>
    createEstrategiaService(tx).preencherEtapa(actor, strategyId, stepType, content),
  );
}

/** ADR-012: exige Membro `role = 'admin'` — verificado dentro do próprio Service. */
export async function aprovarEtapaAction(
  workspaceId: string,
  strategyId: string,
  stepType: StepType,
): Promise<StrategyStep> {
  return withActor(workspaceId, (tx, actor) => createEstrategiaService(tx).aprovarEtapa(actor, strategyId, stepType));
}

export async function adicionarObjetivoAction(
  workspaceId: string,
  strategyId: string,
  description: string,
): Promise<StrategyObjective> {
  return withActor(workspaceId, (tx, actor) =>
    createEstrategiaService(tx).adicionarObjetivo(actor, strategyId, description),
  );
}

export async function listarObjetivosAction(
  workspaceId: string,
  strategyId: string,
): Promise<PaginatedResult<StrategyObjective>> {
  return withActor(workspaceId, (tx, actor) => createEstrategiaService(tx).listarObjetivos(actor, strategyId));
}
