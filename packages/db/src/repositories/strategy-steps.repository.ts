import { eq, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import type { DbClient } from '../transaction';
import { strategySteps } from '../schema';
import { BaseRepository, type ListOptions, type PaginatedResult } from './base.repository';

export type StrategyStep = InferSelectModel<typeof strategySteps>;
export type NewStrategyStep = InferInsertModel<typeof strategySteps>;

/**
 * RFC-001 (Marketing Planning Framework). Sem `delete`: nenhuma fonte
 * documenta remoção de uma etapa — o conteúdo é sempre revisado via
 * `update`, nunca apagado.
 */
export class StrategyStepsRepository {
  private readonly base: BaseRepository<typeof strategySteps, StrategyStep, NewStrategyStep>;

  constructor(db: DbClient) {
    this.base = new BaseRepository(db, strategySteps, strategySteps.id, strategySteps.workspaceId);
  }

  create(input: NewStrategyStep): Promise<StrategyStep> {
    return this.base.create(input);
  }

  findById(workspaceId: string, id: string): Promise<StrategyStep | undefined> {
    return this.base.findById(workspaceId, id);
  }

  findByWorkspace(workspaceId: string, options?: ListOptions): Promise<PaginatedResult<StrategyStep>> {
    return this.base.findByWorkspace(workspaceId, options);
  }

  /** Reflete strategy_steps_strategy_id_step_type_unique — exatamente uma linha por Estratégia. */
  findByStrategy(
    workspaceId: string,
    strategyId: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<StrategyStep>> {
    return this.base.findMany(workspaceId, eq(strategySteps.strategyId, strategyId), options);
  }

  update(workspaceId: string, id: string, patch: Partial<NewStrategyStep>): Promise<StrategyStep | undefined> {
    return this.base.update(workspaceId, id, patch);
  }

  count(workspaceId: string): Promise<number> {
    return this.base.count(workspaceId);
  }

  exists(workspaceId: string, id: string): Promise<boolean> {
    return this.base.exists(workspaceId, id);
  }
}
