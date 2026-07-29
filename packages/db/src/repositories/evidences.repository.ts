import { desc, eq, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import type { DbClient } from '../transaction';
import { evidences } from '../schema';
import { BaseRepository, type ListOptions, type PaginatedResult } from './base.repository';

export type Evidence = InferSelectModel<typeof evidences>;

type EvidenceInsert = InferInsertModel<typeof evidences>;

/**
 * União discriminada que replica em TypeScript, em tempo de compilação, a
 * mesma exclusividade que `evidences_exactly_one_origin_check` garante em
 * tempo de execução (domain.md: Evidência existe dentro de Ação OU
 * Experimento, nunca os dois).
 */
export type NewEvidence =
  | (Omit<EvidenceInsert, 'actionId' | 'experimentId'> & { actionId: string; experimentId?: undefined })
  | (Omit<EvidenceInsert, 'actionId' | 'experimentId'> & { experimentId: string; actionId?: undefined });

/**
 * domain.md: "o registro bruto do que aconteceu" — append-only (RFC-005,
 * critério nº2). Sem `update`/`delete` de propósito, não por omissão.
 */
export class EvidencesRepository {
  private readonly base: BaseRepository<typeof evidences, Evidence, EvidenceInsert>;

  constructor(db: DbClient) {
    this.base = new BaseRepository(db, evidences, evidences.id, evidences.workspaceId);
  }

  create(input: NewEvidence): Promise<Evidence> {
    return this.base.create(input as EvidenceInsert);
  }

  findById(workspaceId: string, id: string): Promise<Evidence | undefined> {
    return this.base.findById(workspaceId, id);
  }

  /** Ordenado por `createdAt desc` — necessário para listagens de "mais recentes" (Dashboard de Execução). */
  findByWorkspace(workspaceId: string, options?: ListOptions): Promise<PaginatedResult<Evidence>> {
    return this.base.findByWorkspace(workspaceId, options, desc(evidences.createdAt));
  }

  findByAction(
    workspaceId: string,
    actionId: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<Evidence>> {
    return this.base.findMany(workspaceId, eq(evidences.actionId, actionId), options);
  }

  findByExperiment(
    workspaceId: string,
    experimentId: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<Evidence>> {
    return this.base.findMany(workspaceId, eq(evidences.experimentId, experimentId), options);
  }

  count(workspaceId: string): Promise<number> {
    return this.base.count(workspaceId);
  }

  exists(workspaceId: string, id: string): Promise<boolean> {
    return this.base.exists(workspaceId, id);
  }
}
