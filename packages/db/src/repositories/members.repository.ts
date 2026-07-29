import { eq, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import type { DbClient } from '../transaction';
import { members } from '../schema';
import { BaseRepository, type ListOptions, type PaginatedResult } from './base.repository';

export type Member = InferSelectModel<typeof members>;
export type NewMember = InferInsertModel<typeof members>;
export type MemberStatus = Member['status'];

/**
 * ADR-011, ADR-012 (`DECISIONS.md`). Apenas persistência — convite, RBAC e
 * transição de status são regra de negócio de `ConfiguracoesService`
 * (`packages/services`), nunca desta camada.
 */
export class MembersRepository {
  private readonly base: BaseRepository<typeof members, Member, NewMember>;

  constructor(private readonly db: DbClient) {
    this.base = new BaseRepository(db, members, members.id, members.workspaceId);
  }

  create(input: NewMember): Promise<Member> {
    return this.base.create(input);
  }

  findById(workspaceId: string, id: string): Promise<Member | undefined> {
    return this.base.findById(workspaceId, id);
  }

  /** Reflete `members_workspace_id_email_unique` — no máximo uma linha por Workspace. */
  async findByEmail(workspaceId: string, email: string): Promise<Member | undefined> {
    const { items } = await this.base.findMany(workspaceId, eq(members.email, email), { limit: 1 });
    return items[0];
  }

  /**
   * Única consulta desta tabela que não é escopada por `workspace_id` — é o
   * que resolve "a quais Workspaces este usuário pertence" (ADR-014). Não
   * passa por `BaseRepository`, pelo mesmo motivo de `WorkspacesRepository`:
   * a operação não é, por natureza, escopada a um único Workspace.
   */
  findByUserId(userId: string): Promise<Member[]> {
    return this.db.select().from(members).where(eq(members.userId, userId));
  }

  findByWorkspace(workspaceId: string, options?: ListOptions): Promise<PaginatedResult<Member>> {
    return this.base.findByWorkspace(workspaceId, options);
  }

  /**
   * `expectedStatus` habilita escrita condicional (RFC-004; ARCHITECTURE_RESOLUTION.md
   * B5) sem expor `SQL` do Drizzle — mesmo padrão de `ActionsRepository`/`HypothesesRepository`.
   */
  update(
    workspaceId: string,
    id: string,
    patch: Partial<NewMember>,
    expectedStatus?: MemberStatus,
  ): Promise<Member | undefined> {
    const condition = expectedStatus ? eq(members.status, expectedStatus) : undefined;
    return this.base.update(workspaceId, id, patch, condition);
  }
}
