import { desc, eq, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import type { DbClient } from '../transaction';
import { actions } from '../schema';
import { BaseRepository, type ListOptions, type PaginatedResult } from './base.repository';

export type Action = InferSelectModel<typeof actions>;
export type NewAction = InferInsertModel<typeof actions>;
export type ActionStatus = Action['status'];

/**
 * RFC-002; RFC-004 (máquina de estados). Sem `delete`: nenhuma fonte
 * documenta remoção de uma Ação — apenas transição de `status` via `update`.
 */
export class ActionsRepository {
  private readonly base: BaseRepository<typeof actions, Action, NewAction>;

  constructor(db: DbClient) {
    this.base = new BaseRepository(db, actions, actions.id, actions.workspaceId);
  }

  create(input: NewAction): Promise<Action> {
    return this.base.create(input);
  }

  findById(workspaceId: string, id: string): Promise<Action | undefined> {
    return this.base.findById(workspaceId, id);
  }

  /** Ordenado por `createdAt desc` — necessário para listagens de "mais recentes" (Dashboard de Execução). */
  findByWorkspace(workspaceId: string, options?: ListOptions): Promise<PaginatedResult<Action>> {
    return this.base.findByWorkspace(workspaceId, options, desc(actions.createdAt));
  }

  findByTactic(
    workspaceId: string,
    tacticId: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<Action>> {
    return this.base.findMany(workspaceId, eq(actions.tacticId, tacticId), options);
  }

  /**
   * `expectedStatus` habilita escrita condicional (RFC-004; ARCHITECTURE_RESOLUTION.md
   * B5) sem expor `SQL` do Drizzle — a tradução para `eq()` acontece aqui dentro.
   */
  update(
    workspaceId: string,
    id: string,
    patch: Partial<NewAction>,
    expectedStatus?: ActionStatus,
  ): Promise<Action | undefined> {
    const condition = expectedStatus ? eq(actions.status, expectedStatus) : undefined;
    return this.base.update(workspaceId, id, patch, condition);
  }

  count(workspaceId: string): Promise<number> {
    return this.base.count(workspaceId);
  }

  exists(workspaceId: string, id: string): Promise<boolean> {
    return this.base.exists(workspaceId, id);
  }
}
