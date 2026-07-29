'use server';

import type { DbClient, ListOptions, PaginatedResult } from '@vektor/db';
import type { ActorContext, Member, MemberRole } from '@vektor/services';
import { getAuthenticatedUser } from '../server/auth';
import {
  createConfiguracoesService,
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

/** ADR-012: exige Membro `role = 'admin'` — verificado dentro do próprio Service. */
export async function convidarMembroAction(workspaceId: string, email: string, role?: MemberRole): Promise<Member> {
  return withActor(workspaceId, (tx, actor) => createConfiguracoesService(tx).convidarMembro(actor, email, role));
}

/**
 * Quem aceita ainda não é Membro `ativo` — identificado pela própria sessão
 * autenticada.
 *
 * F3 (Threat Modeling Review): exige e-mail verificado pelo Supabase Auth
 * antes de aceitar — sem isso, alguém que se cadastre com um e-mail alheio
 * ainda não confirmado poderia, em tese, aceitar um convite destinado a
 * outra pessoa. `members.user_id` só é populado (dentro do Service) depois
 * dessa checagem passar.
 */
export async function aceitarConviteAction(workspaceId: string): Promise<Member> {
  const { userId, email, emailVerified } = await getAuthenticatedUser();
  if (!emailVerified) {
    throw new Error('E-mail não verificado — confirme seu e-mail antes de aceitar o convite.');
  }
  return runInRequestContext(userId, (tx) =>
    createConfiguracoesService(tx).aceitarConvite({ userId, email, workspaceId }),
  );
}

export async function removerMembroAction(workspaceId: string, targetMemberId: string): Promise<Member> {
  return withActor(workspaceId, (tx, actor) => createConfiguracoesService(tx).removerMembro(actor, targetMemberId));
}

export async function alterarRoleAction(
  workspaceId: string,
  targetMemberId: string,
  newRole: MemberRole,
): Promise<Member> {
  return withActor(workspaceId, (tx, actor) =>
    createConfiguracoesService(tx).alterarRole(actor, targetMemberId, newRole),
  );
}

export async function listarMembrosAction(
  workspaceId: string,
  options?: ListOptions,
): Promise<PaginatedResult<Member>> {
  return withActor(workspaceId, (tx) => createConfiguracoesService(tx).listarMembros({ workspaceId }, options));
}
