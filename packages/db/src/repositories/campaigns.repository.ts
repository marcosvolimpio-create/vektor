import { desc, eq, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import type { DbClient } from '../transaction';
import { campaigns } from '../schema';
import { BaseRepository, type ListOptions, type PaginatedResult } from './base.repository';

export type Campaign = InferSelectModel<typeof campaigns>;
export type NewCampaign = InferInsertModel<typeof campaigns>;

/**
 * RFC-002. Sem `update`/`delete`: docs/database/rls-policies.md — "nenhuma
 * fonte descreve edição ou remoção de Campanha após criada".
 */
export class CampaignsRepository {
  private readonly base: BaseRepository<typeof campaigns, Campaign, NewCampaign>;

  constructor(db: DbClient) {
    this.base = new BaseRepository(db, campaigns, campaigns.id, campaigns.workspaceId);
  }

  create(input: NewCampaign): Promise<Campaign> {
    return this.base.create(input);
  }

  findById(workspaceId: string, id: string): Promise<Campaign | undefined> {
    return this.base.findById(workspaceId, id);
  }

  /** Ordenado por `createdAt desc` — necessário para listagens de "mais recentes" (Dashboard de Execução). */
  findByWorkspace(workspaceId: string, options?: ListOptions): Promise<PaginatedResult<Campaign>> {
    return this.base.findByWorkspace(workspaceId, options, desc(campaigns.createdAt));
  }

  findByStrategy(
    workspaceId: string,
    strategyId: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<Campaign>> {
    return this.base.findMany(workspaceId, eq(campaigns.strategyId, strategyId), options);
  }

  count(workspaceId: string): Promise<number> {
    return this.base.count(workspaceId);
  }

  exists(workspaceId: string, id: string): Promise<boolean> {
    return this.base.exists(workspaceId, id);
  }
}
