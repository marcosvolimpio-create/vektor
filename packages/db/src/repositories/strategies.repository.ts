import { eq, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import type { DbClient } from '../transaction';
import { strategies } from '../schema';
import { BaseRepository, type ListOptions, type PaginatedResult } from './base.repository';

export type Strategy = InferSelectModel<typeof strategies>;
export type NewStrategy = InferInsertModel<typeof strategies>;
export type StrategyStatus = Strategy['status'];

/**
 * RFC-001; ADR-003 (uma ativa por Workspace); ADR-004.
 * Sem `delete`: nenhuma fonte documenta exclusão física de Estratégia —
 * apenas encerramento, que é uma mudança de `status` via `update` comum
 * (docs/database/physical-model.md).
 */
export class StrategiesRepository {
  private readonly base: BaseRepository<typeof strategies, Strategy, NewStrategy>;

  constructor(db: DbClient) {
    this.base = new BaseRepository(db, strategies, strategies.id, strategies.workspaceId);
  }

  create(input: NewStrategy): Promise<Strategy> {
    return this.base.create(input);
  }

  findById(workspaceId: string, id: string): Promise<Strategy | undefined> {
    return this.base.findById(workspaceId, id);
  }

  findByWorkspace(workspaceId: string, options?: ListOptions): Promise<PaginatedResult<Strategy>> {
    return this.base.findByWorkspace(workspaceId, options);
  }

  /**
   * `expectedStatus` habilita escrita condicional (RFC-005/`evoluirEstrategia`;
   * ARCHITECTURE_RESOLUTION.md B5) — mesmo padrão de `ActionsRepository`/
   * `HypothesesRepository`/`ExperimentsRepository`.
   */
  update(
    workspaceId: string,
    id: string,
    patch: Partial<NewStrategy>,
    expectedStatus?: StrategyStatus,
  ): Promise<Strategy | undefined> {
    const condition = expectedStatus ? eq(strategies.status, expectedStatus) : undefined;
    return this.base.update(workspaceId, id, patch, condition);
  }

  count(workspaceId: string): Promise<number> {
    return this.base.count(workspaceId);
  }

  exists(workspaceId: string, id: string): Promise<boolean> {
    return this.base.exists(workspaceId, id);
  }
}
