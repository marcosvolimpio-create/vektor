'use server';

import type { Action, Campaign, DbClient, Evidence, ListOptions, PaginatedResult, Tactic } from '@vektor/db';
import type {
  ActorContext,
  ConcluirAcaoInput,
  CriarAcaoInput,
  CriarCampanhaInput,
  CriarTaticaInput,
  RegistrarEvidenciaInput,
} from '@vektor/services';
import { getAuthenticatedUser } from '../server/auth';
import { createExecucaoService, resolveRequestActorContext, runInRequestContext } from '../server/composition-root';

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

export async function criarCampanhaAction(
  workspaceId: string,
  strategyId: string,
  input: CriarCampanhaInput,
): Promise<Campaign> {
  return withActor(workspaceId, (tx, actor) => createExecucaoService(tx).criarCampanha(actor, strategyId, input));
}

export async function listarCampanhasAction(
  workspaceId: string,
  strategyId?: string,
  options?: ListOptions,
): Promise<PaginatedResult<Campaign>> {
  return withActor(workspaceId, (tx, actor) =>
    createExecucaoService(tx).listarCampanhas(actor, strategyId, options),
  );
}

export async function obterCampanhaAction(workspaceId: string, campaignId: string): Promise<Campaign> {
  return withActor(workspaceId, (tx, actor) => createExecucaoService(tx).obterCampanha(actor, campaignId));
}

export async function criarTaticaAction(
  workspaceId: string,
  campaignId: string,
  input: CriarTaticaInput,
): Promise<Tactic> {
  return withActor(workspaceId, (tx, actor) => createExecucaoService(tx).criarTatica(actor, campaignId, input));
}

export async function listarTaticasAction(
  workspaceId: string,
  campaignId?: string,
  options?: ListOptions,
): Promise<PaginatedResult<Tactic>> {
  return withActor(workspaceId, (tx, actor) =>
    createExecucaoService(tx).listarTaticas(actor, campaignId, options),
  );
}

export async function obterTaticaAction(workspaceId: string, tacticId: string): Promise<Tactic> {
  return withActor(workspaceId, (tx, actor) => createExecucaoService(tx).obterTatica(actor, tacticId));
}

export async function criarAcaoAction(
  workspaceId: string,
  tacticId: string,
  input: CriarAcaoInput,
): Promise<Action> {
  return withActor(workspaceId, (tx, actor) => createExecucaoService(tx).criarAcao(actor, tacticId, input));
}

export async function listarAcoesAction(
  workspaceId: string,
  tacticId?: string,
  options?: ListOptions,
): Promise<PaginatedResult<Action>> {
  return withActor(workspaceId, (tx, actor) => createExecucaoService(tx).listarAcoes(actor, tacticId, options));
}

export async function obterAcaoAction(workspaceId: string, actionId: string): Promise<Action> {
  return withActor(workspaceId, (tx, actor) => createExecucaoService(tx).obterAcao(actor, actionId));
}

/** RFC-004: Proposta → Aprovada. ADR-012: qualquer Membro ativo, sem exigir `admin`. */
export async function aprovarAcaoAction(workspaceId: string, actionId: string): Promise<Action> {
  return withActor(workspaceId, (tx, actor) => createExecucaoService(tx).aprovarAcao(actor, actionId));
}

/** RFC-004: Aprovada → Em execução. */
export async function iniciarExecucaoAcaoAction(workspaceId: string, actionId: string): Promise<Action> {
  return withActor(workspaceId, (tx, actor) => createExecucaoService(tx).iniciarExecucaoAcao(actor, actionId));
}

/** RFC-004: Em execução → Concluída/Publicada. RFC-002 crit. nº5: grava Evidência na mesma transação. */
export async function concluirAcaoAction(
  workspaceId: string,
  actionId: string,
  input: ConcluirAcaoInput,
): Promise<Action> {
  return withActor(workspaceId, (tx, actor) => createExecucaoService(tx).concluirAcao(actor, actionId, input));
}

/**
 * Registro de Evidência independente da conclusão da Ação — distinto de
 * `concluirAcaoAction`, que continua sendo o único caminho que também
 * transiciona o `status` da Ação.
 */
export async function criarEvidenciaAction(
  workspaceId: string,
  actionId: string,
  input: RegistrarEvidenciaInput,
): Promise<Evidence> {
  return withActor(workspaceId, (tx, actor) =>
    createExecucaoService(tx).registrarEvidencia(actor, actionId, input),
  );
}

export async function obterEvidenciaAction(workspaceId: string, evidenceId: string): Promise<Evidence> {
  return withActor(workspaceId, (tx, actor) => createExecucaoService(tx).obterEvidencia(actor, evidenceId));
}

export async function listarEvidenciasAction(
  workspaceId: string,
  actionId?: string,
  options?: ListOptions,
): Promise<PaginatedResult<Evidence>> {
  return withActor(workspaceId, (tx, actor) =>
    createExecucaoService(tx).listarEvidencias(actor, actionId, options),
  );
}
