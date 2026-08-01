import { and, desc, eq, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import type { DbClient } from '../transaction';
import { executionRecommendations } from '../schema';
import { BaseRepository, type ListOptions, type PaginatedResult } from './base.repository';

export type ExecutionRecommendation = InferSelectModel<typeof executionRecommendations>;
export type NewExecutionRecommendation = InferInsertModel<typeof executionRecommendations>;
export type ExecutionRecommendationStatus = ExecutionRecommendation['status'];

/**
 * Sprint 4 (Execução Inteligente). Sem `delete`: uma recomendação processada
 * (aceita/descartada) permanece como histórico, nunca é removida.
 */
export class ExecutionRecommendationsRepository {
  private readonly base: BaseRepository<
    typeof executionRecommendations,
    ExecutionRecommendation,
    NewExecutionRecommendation
  >;

  constructor(db: DbClient) {
    this.base = new BaseRepository(
      db,
      executionRecommendations,
      executionRecommendations.id,
      executionRecommendations.workspaceId,
    );
  }

  create(input: NewExecutionRecommendation): Promise<ExecutionRecommendation> {
    return this.base.create(input);
  }

  findById(workspaceId: string, id: string): Promise<ExecutionRecommendation | undefined> {
    return this.base.findById(workspaceId, id);
  }

  findByStrategy(
    workspaceId: string,
    strategyId: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<ExecutionRecommendation>> {
    return this.base.findMany(
      workspaceId,
      eq(executionRecommendations.strategyId, strategyId),
      options,
      desc(executionRecommendations.createdAt),
    );
  }

  /** Usado só para checar duplicidade antes de persistir uma nova recomendação — o índice único parcial garante no máximo 1 linha. */
  async findPendingByDedupeKey(
    workspaceId: string,
    dedupeKey: string,
  ): Promise<ExecutionRecommendation | undefined> {
    const result = await this.base.findMany(
      workspaceId,
      and(eq(executionRecommendations.dedupeKey, dedupeKey), eq(executionRecommendations.status, 'pendente')),
      { limit: 1 },
    );
    return result.items[0];
  }

  /**
   * `expectedStatus` habilita escrita condicional (mesmo padrão de
   * `ActionsRepository`/`ExperimentsRepository`/`StrategiesRepository`).
   */
  update(
    workspaceId: string,
    id: string,
    patch: Partial<NewExecutionRecommendation>,
    expectedStatus?: ExecutionRecommendationStatus,
  ): Promise<ExecutionRecommendation | undefined> {
    const condition = expectedStatus ? eq(executionRecommendations.status, expectedStatus) : undefined;
    return this.base.update(workspaceId, id, patch, condition);
  }

  count(workspaceId: string): Promise<number> {
    return this.base.count(workspaceId);
  }
}
