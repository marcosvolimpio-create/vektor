import { desc, eq, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import type { DbClient } from '../transaction';
import { tactics } from '../schema';
import { BaseRepository, type ListOptions, type PaginatedResult } from './base.repository';

export type Tactic = InferSelectModel<typeof tactics>;
export type NewTactic = InferInsertModel<typeof tactics>;

/**
 * RFC-002. Sem `update`/`delete`, mesma justificativa de CampaignsRepository
 * (docs/database/rls-policies.md).
 */
export class TacticsRepository {
  private readonly base: BaseRepository<typeof tactics, Tactic, NewTactic>;

  constructor(db: DbClient) {
    this.base = new BaseRepository(db, tactics, tactics.id, tactics.workspaceId);
  }

  create(input: NewTactic): Promise<Tactic> {
    return this.base.create(input);
  }

  findById(workspaceId: string, id: string): Promise<Tactic | undefined> {
    return this.base.findById(workspaceId, id);
  }

  /** Ordenado por `createdAt desc` — necessário para listagens de "mais recentes" (Dashboard de Execução). */
  findByWorkspace(workspaceId: string, options?: ListOptions): Promise<PaginatedResult<Tactic>> {
    return this.base.findByWorkspace(workspaceId, options, desc(tactics.createdAt));
  }

  findByCampaign(
    workspaceId: string,
    campaignId: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<Tactic>> {
    return this.base.findMany(workspaceId, eq(tactics.campaignId, campaignId), options);
  }

  count(workspaceId: string): Promise<number> {
    return this.base.count(workspaceId);
  }

  exists(workspaceId: string, id: string): Promise<boolean> {
    return this.base.exists(workspaceId, id);
  }
}
