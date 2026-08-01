'use server';

import type { DbClient, Learning, ListOptions, PaginatedResult, Strategy } from '@vektor/db';
import type { ActorContext } from '@vektor/services';
import { getAuthenticatedUser } from '../server/auth';
import {
  createAprendizadoService,
  resolveRequestActorContext,
  runInRequestContext,
} from '../server/composition-root';

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

/** ADR-012: qualquer Membro ativo — "registrar conteúdo de Aprendizado" não exige `admin`. */
export async function registrarAprendizadoAction(
  workspaceId: string,
  evidenceId: string,
  content: unknown,
): Promise<Learning> {
  return withActor(workspaceId, (tx, actor) =>
    createAprendizadoService(tx).registrarAprendizado(actor, evidenceId, { content }),
  );
}

export async function listarAprendizadosAction(
  workspaceId: string,
  evidenceId?: string,
  options?: ListOptions,
): Promise<PaginatedResult<Learning>> {
  return withActor(workspaceId, (tx, actor) =>
    createAprendizadoService(tx).listarAprendizados(actor, evidenceId, options),
  );
}

export async function obterAprendizadoAction(workspaceId: string, learningId: string): Promise<Learning> {
  return withActor(workspaceId, (tx, actor) => createAprendizadoService(tx).obterAprendizado(actor, learningId));
}

/** ADR-012: exige Membro `role = 'admin'` — verificado dentro do próprio Service. */
export async function evoluirEstrategiaAction(
  workspaceId: string,
  currentStrategyId: string,
): Promise<Strategy> {
  return withActor(workspaceId, (tx, actor) =>
    createAprendizadoService(tx).evoluirEstrategia(actor, currentStrategyId),
  );
}
