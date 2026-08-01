import type { DbClient } from '@vektor/db';
import { AcessoNegadoError, AutorizacaoInsuficienteError } from './errors';
import type { MemberRole, MembersRepositoryFactory, MembersRepositoryPort } from './ports';

/**
 * Contexto autenticado que toda Server Action deve resolver, conforme
 * ADR-014, antes de chamar qualquer método de Service — nunca construído a
 * partir de um `workspaceId`/`memberId` enviado pelo cliente (A10).
 *
 * Nenhum Service desta camada consulta `members` para descobrir quem está
 * agindo — a identidade e o `role` já chegam resolvidos aqui. O que cada
 * Service faz é *validar* esse contexto contra a regra da operação (ADR-012),
 * nunca re-derivá-lo.
 */
export interface ActorContext {
  readonly workspaceId: string;
  readonly memberId: string;
  readonly role: MemberRole;
}

/**
 * Implementa a resolução de contexto exigida por ADR-014: dado um usuário
 * autenticado (`auth.uid()`, resolvido pela Server Action via Supabase Auth)
 * e o Workspace escolhido, retorna o `ActorContext` correspondente.
 *
 * Também é o ponto de aplicação de A4 — nunca cacheia `status`; cada chamada
 * relê `members` e falha se o Membro não estiver `ativo`.
 */
export async function resolveActorContext(
  membersRepository: MembersRepositoryPort,
  userId: string,
  workspaceId: string,
): Promise<ActorContext> {
  const memberships = await membersRepository.findByUserId(userId);
  const membership = memberships.find((m) => m.workspaceId === workspaceId && m.status === 'ativo');

  if (!membership) {
    throw new AcessoNegadoError(userId, workspaceId);
  }

  return { workspaceId: membership.workspaceId, memberId: membership.id, role: membership.role };
}

/**
 * Lista os Workspaces onde o usuário é Membro ativo — usado para popular o
 * Seletor de Workspace (`architecture/navigation.md`) antes de um
 * `workspaceId` específico ser escolhido.
 */
export async function listActiveMemberships(
  membersRepository: MembersRepositoryPort,
  userId: string,
): Promise<ActorContext[]> {
  const memberships = await membersRepository.findByUserId(userId);
  return memberships
    .filter((m) => m.status === 'ativo')
    .map((m) => ({ workspaceId: m.workspaceId, memberId: m.id, role: m.role }));
}

/** ADR-012: lança `AutorizacaoInsuficienteError` se o ator não for `admin`. */
export function assertAdmin(actor: ActorContext, operation: string): void {
  if (actor.role !== 'admin') {
    throw new AutorizacaoInsuficienteError(operation, 'admin');
  }
}

/**
 * ADR-014/A4: revalida `actor.memberId` contra a linha real de `members`
 * dentro da mesma transação da escrita — nunca confia apenas no `role` que
 * chegou em `ActorContext`, mesmo já tendo passado por `assertAdmin`.
 *
 * Débito arquitetural conhecido, registrado e não ampliado aqui:
 * `EstrategiaService` e `GrowthService` já têm cada um sua própria versão
 * privada e idêntica desta função (backlog: extrair as duas para cá). Esta
 * função existe para que `AprendizadoService` (RFC-005) reutilize um
 * mecanismo em vez de introduzir uma terceira cópia — não consolida as duas
 * já existentes, o que está fora do escopo desta RFC.
 */
export async function assertAindaAdmin(
  actor: ActorContext,
  membersRepositoryFactory: MembersRepositoryFactory,
  dbClient: DbClient,
  operation: string,
): Promise<void> {
  const membersRepository = membersRepositoryFactory(dbClient);
  const membro = await membersRepository.findById(actor.workspaceId, actor.memberId);
  if (!membro || membro.status !== 'ativo' || membro.role !== 'admin') {
    throw new AutorizacaoInsuficienteError(operation, 'admin');
  }
}
