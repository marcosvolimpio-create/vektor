import { desc, eq, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import type { DbClient } from '../transaction';
import { learnings } from '../schema';
import { BaseRepository, type ListOptions, type PaginatedResult } from './base.repository';

export type Learning = InferSelectModel<typeof learnings>;
export type NewLearning = InferInsertModel<typeof learnings>;

/**
 * RFC-005, critério nº2: "nenhuma entrada de Aprendizado é descartada".
 * Sem `update`/`delete` de propósito, não por omissão.
 */
export class LearningsRepository {
  private readonly base: BaseRepository<typeof learnings, Learning, NewLearning>;

  constructor(db: DbClient) {
    this.base = new BaseRepository(db, learnings, learnings.id, learnings.workspaceId);
  }

  create(input: NewLearning): Promise<Learning> {
    return this.base.create(input);
  }

  findById(workspaceId: string, id: string): Promise<Learning | undefined> {
    return this.base.findById(workspaceId, id);
  }

  /** Consumido por Biblioteca/Relatórios (RFC-006/RFC-007) — mais recentes primeiro. */
  findByWorkspace(workspaceId: string, options?: ListOptions): Promise<PaginatedResult<Learning>> {
    return this.base.findMany(workspaceId, undefined, options, desc(learnings.createdAt));
  }

  findByEvidence(
    workspaceId: string,
    evidenceId: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<Learning>> {
    return this.base.findMany(workspaceId, eq(learnings.evidenceId, evidenceId), options);
  }

  count(workspaceId: string): Promise<number> {
    return this.base.count(workspaceId);
  }

  exists(workspaceId: string, id: string): Promise<boolean> {
    return this.base.exists(workspaceId, id);
  }
}
