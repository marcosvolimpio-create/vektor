import { eq, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import type { DbClient } from '../transaction';
import { hypotheses } from '../schema';
import { BaseRepository, type ListOptions, type PaginatedResult } from './base.repository';

export type Hypothesis = InferSelectModel<typeof hypotheses>;
export type NewHypothesis = InferInsertModel<typeof hypotheses>;
export type HypothesisStatus = Hypothesis['status'];

/**
 * RFC-003; RFC-004 (máquina de estados). Sem `delete`: nenhuma fonte
 * documenta remoção de uma Hipótese — apenas transição de `status`.
 */
export class HypothesesRepository {
  private readonly base: BaseRepository<typeof hypotheses, Hypothesis, NewHypothesis>;

  constructor(db: DbClient) {
    this.base = new BaseRepository(db, hypotheses, hypotheses.id, hypotheses.workspaceId);
  }

  create(input: NewHypothesis): Promise<Hypothesis> {
    return this.base.create(input);
  }

  findById(workspaceId: string, id: string): Promise<Hypothesis | undefined> {
    return this.base.findById(workspaceId, id);
  }

  findByWorkspace(workspaceId: string, options?: ListOptions): Promise<PaginatedResult<Hypothesis>> {
    return this.base.findByWorkspace(workspaceId, options);
  }

  findByEvidence(
    workspaceId: string,
    evidenceId: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<Hypothesis>> {
    return this.base.findMany(workspaceId, eq(hypotheses.evidenceId, evidenceId), options);
  }

  /**
   * `expectedStatus` habilita escrita condicional (RFC-004; ARCHITECTURE_RESOLUTION.md
   * B5) sem expor `SQL` do Drizzle — a tradução para `eq()` acontece aqui dentro.
   */
  update(
    workspaceId: string,
    id: string,
    patch: Partial<NewHypothesis>,
    expectedStatus?: HypothesisStatus,
  ): Promise<Hypothesis | undefined> {
    const condition = expectedStatus ? eq(hypotheses.status, expectedStatus) : undefined;
    return this.base.update(workspaceId, id, patch, condition);
  }

  count(workspaceId: string): Promise<number> {
    return this.base.count(workspaceId);
  }

  exists(workspaceId: string, id: string): Promise<boolean> {
    return this.base.exists(workspaceId, id);
  }
}
