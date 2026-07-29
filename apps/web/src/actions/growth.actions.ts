'use server';

import type { DbClient, Evidence, Experiment, Hypothesis, ListOptions, PaginatedResult } from '@vektor/db';
import type { ActorContext, ProporExperimentoInput, ConcluirExperimentoInput } from '@vektor/services';
import { getAuthenticatedUser } from '../server/auth';
import {
  createGrowthService,
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

export async function registrarHipoteseAction(
  workspaceId: string,
  evidenceId: string,
  description: string,
): Promise<Hypothesis> {
  return withActor(workspaceId, (_tx, actor) =>
    createGrowthService(_tx).registrarHipotese(actor, evidenceId, { description }),
  );
}

export async function listarHipotesesAction(
  workspaceId: string,
  evidenceId?: string,
  options?: ListOptions,
): Promise<PaginatedResult<Hypothesis>> {
  return withActor(workspaceId, (tx, actor) =>
    createGrowthService(tx).listarHipoteses(actor, evidenceId, options),
  );
}

export async function obterHipoteseAction(workspaceId: string, hypothesisId: string): Promise<Hypothesis> {
  return withActor(workspaceId, (tx, actor) => createGrowthService(tx).obterHipotese(actor, hypothesisId));
}

/** RFC-004: Registrada → Priorizada. */
export async function priorizarHipoteseAction(workspaceId: string, hypothesisId: string): Promise<Hypothesis> {
  return withActor(workspaceId, (tx, actor) => createGrowthService(tx).priorizarHipotese(actor, hypothesisId));
}

export async function proporExperimentoAction(
  workspaceId: string,
  input: ProporExperimentoInput,
): Promise<Experiment> {
  return withActor(workspaceId, (tx, actor) => createGrowthService(tx).proporExperimento(actor, input));
}

export async function listarExperimentosAction(
  workspaceId: string,
  hypothesisId?: string,
  options?: ListOptions,
): Promise<PaginatedResult<Experiment>> {
  return withActor(workspaceId, (tx, actor) =>
    createGrowthService(tx).listarExperimentos(actor, hypothesisId, options),
  );
}

export async function obterExperimentoAction(workspaceId: string, experimentId: string): Promise<Experiment> {
  return withActor(workspaceId, (tx, actor) => createGrowthService(tx).obterExperimento(actor, experimentId));
}

/** ADR-012: exige Membro `role = 'admin'` — verificado dentro do próprio Service. */
export async function aprovarExperimentoAction(workspaceId: string, experimentId: string): Promise<Experiment> {
  return withActor(workspaceId, (tx, actor) => createGrowthService(tx).aprovarExperimento(actor, experimentId));
}

export async function iniciarExecucaoExperimentoAction(
  workspaceId: string,
  experimentId: string,
): Promise<Experiment> {
  return withActor(workspaceId, (tx, actor) =>
    createGrowthService(tx).iniciarExecucaoExperimento(actor, experimentId),
  );
}

export async function concluirExperimentoAction(
  workspaceId: string,
  experimentId: string,
  input: ConcluirExperimentoInput,
): Promise<{ experiment: Experiment; evidence: Evidence }> {
  return withActor(workspaceId, (tx, actor) =>
    createGrowthService(tx).concluirExperimento(actor, experimentId, input),
  );
}
