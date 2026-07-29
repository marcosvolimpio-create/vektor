import { eq, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import type { DbClient } from '../transaction';
import { strategyObjectives } from '../schema';
import { BaseRepository, type ListOptions, type PaginatedResult } from './base.repository';

export type StrategyObjective = InferSelectModel<typeof strategyObjectives>;
export type NewStrategyObjective = InferInsertModel<typeof strategyObjectives>;

/**
 * RFC-001 (etapa Objetivos); RFC-003 critério nº2. Sem `update`/`delete`:
 * nenhuma fonte documenta edição ou remoção de um Objetivo após criado.
 */
export class StrategyObjectivesRepository {
  private readonly base: BaseRepository<typeof strategyObjectives, StrategyObjective, NewStrategyObjective>;

  constructor(db: DbClient) {
    this.base = new BaseRepository(
      db,
      strategyObjectives,
      strategyObjectives.id,
      strategyObjectives.workspaceId,
    );
  }

  create(input: NewStrategyObjective): Promise<StrategyObjective> {
    return this.base.create(input);
  }

  findById(workspaceId: string, id: string): Promise<StrategyObjective | undefined> {
    return this.base.findById(workspaceId, id);
  }

  findByWorkspace(workspaceId: string, options?: ListOptions): Promise<PaginatedResult<StrategyObjective>> {
    return this.base.findByWorkspace(workspaceId, options);
  }

  findByStrategy(
    workspaceId: string,
    strategyId: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<StrategyObjective>> {
    return this.base.findMany(workspaceId, eq(strategyObjectives.strategyId, strategyId), options);
  }

  count(workspaceId: string): Promise<number> {
    return this.base.count(workspaceId);
  }

  exists(workspaceId: string, id: string): Promise<boolean> {
    return this.base.exists(workspaceId, id);
  }
}
