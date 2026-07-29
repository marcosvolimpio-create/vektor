/**
 * Port (contrato) para o repositório de Membro.
 *
 * ADR-011 (`DECISIONS.md`) ratifica a entidade Membro e sua estrutura, mas o
 * repositório Drizzle concreto (`@vektor/db`, `MembersRepository`) ainda não
 * foi implementado — está fora do escopo desta tarefa ("não implemente
 * Repositories"). Esta interface descreve exatamente a forma que esse
 * repositório precisa ter para que os Services desta camada funcionem,
 * seguindo o mesmo estilo dos repositórios já existentes em
 * `packages/db/src/repositories/*` (`workspace_id` explícito em todo método,
 * escrita condicional via `expectedStatus`).
 *
 * Quando `MembersRepository` for implementado, ele deve satisfazer este
 * contrato — nenhuma mudança é esperada nos Services que o consomem.
 */

import type { DbClient, ListOptions, PaginatedResult } from '@vektor/db';

export type MemberRole = 'admin' | 'membro';
export type MemberStatus = 'convidado' | 'ativo' | 'removido';

export interface Member {
  id: string;
  workspaceId: string;
  userId: string | null;
  email: string;
  status: MemberStatus;
  role: MemberRole;
  invitedBy: string | null;
  invitedAt: Date;
  joinedAt: Date | null;
  createdAt: Date;
}

export interface NewMember {
  workspaceId: string;
  email: string;
  role: MemberRole;
  status?: MemberStatus;
  userId?: string | null;
  invitedBy?: string | null;
  joinedAt?: Date | null;
}

export interface MemberPatch {
  userId?: string | null;
  status?: MemberStatus;
  role?: MemberRole;
  joinedAt?: Date | null;
}

export interface MembersRepositoryPort {
  create(input: NewMember): Promise<Member>;
  findById(workspaceId: string, id: string): Promise<Member | undefined>;
  findByEmail(workspaceId: string, email: string): Promise<Member | undefined>;
  /** Cross-workspace por definição — é o que resolve "a quais Workspaces este usuário pertence" (ADR-014). */
  findByUserId(userId: string): Promise<Member[]>;
  findByWorkspace(workspaceId: string, options?: ListOptions): Promise<PaginatedResult<Member>>;
  /** `expectedStatus` habilita escrita condicional (B5), mesmo padrão de `ActionsRepository`/`HypothesesRepository`. */
  update(
    workspaceId: string,
    id: string,
    patch: MemberPatch,
    expectedStatus?: MemberStatus,
  ): Promise<Member | undefined>;
}

/**
 * Fábrica de `MembersRepositoryPort` a partir de um `DbClient` — mesma forma
 * de um construtor de repositório real (`new MembersRepository(db)`), para
 * que um Service consiga reconstruir o repositório contra uma transação
 * (`tx`) quando precisar de atomicidade entre `members` e outra tabela (ex.:
 * `WorkspaceService.criarWorkspace`, ADR-013). Quando `MembersRepository`
 * existir em `@vektor/db`, a fábrica passa a ser literalmente
 * `(db) => new MembersRepository(db)`.
 */
export type MembersRepositoryFactory = (db: DbClient) => MembersRepositoryPort;
