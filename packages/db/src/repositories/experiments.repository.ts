import { eq, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import type { DbClient } from '../transaction';
import { experiments } from '../schema';
import { BaseRepository, type ListOptions, type PaginatedResult } from './base.repository';

export type Experiment = InferSelectModel<typeof experiments>;
export type ExperimentStatus = Experiment['status'];

type ExperimentInsert = InferInsertModel<typeof experiments>;

/**
 * União discriminada espelhando `experiments_exactly_one_owner_check`
 * (posse polimórfica: Tática OU Ação, nunca as duas) — mesma técnica de
 * EvidencesRepository.
 */
export type NewExperiment =
  | (Omit<ExperimentInsert, 'tacticId' | 'actionId'> & { tacticId: string; actionId?: undefined })
  | (Omit<ExperimentInsert, 'tacticId' | 'actionId'> & { actionId: string; tacticId?: undefined });

/**
 * RFC-002; RFC-003; RFC-004 (máquina de estados). Sem `delete`: nenhuma
 * fonte documenta remoção de um Experimento — apenas transição de `status`.
 * `approvedBy` não é decidido aqui — Bloqueador 3 (quem aprova) ainda está
 * pendente em ARCHITECTURE_RESOLUTION.md (B2).
 */
export class ExperimentsRepository {
  private readonly base: BaseRepository<typeof experiments, Experiment, ExperimentInsert>;

  constructor(db: DbClient) {
    this.base = new BaseRepository(db, experiments, experiments.id, experiments.workspaceId);
  }

  create(input: NewExperiment): Promise<Experiment> {
    return this.base.create(input as ExperimentInsert);
  }

  findById(workspaceId: string, id: string): Promise<Experiment | undefined> {
    return this.base.findById(workspaceId, id);
  }

  findByWorkspace(workspaceId: string, options?: ListOptions): Promise<PaginatedResult<Experiment>> {
    return this.base.findByWorkspace(workspaceId, options);
  }

  findByHypothesis(
    workspaceId: string,
    hypothesisId: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<Experiment>> {
    return this.base.findMany(workspaceId, eq(experiments.hypothesisId, hypothesisId), options);
  }

  findByObjective(
    workspaceId: string,
    objectiveId: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<Experiment>> {
    return this.base.findMany(workspaceId, eq(experiments.objectiveId, objectiveId), options);
  }

  findByTactic(
    workspaceId: string,
    tacticId: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<Experiment>> {
    return this.base.findMany(workspaceId, eq(experiments.tacticId, tacticId), options);
  }

  findByAction(
    workspaceId: string,
    actionId: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<Experiment>> {
    return this.base.findMany(workspaceId, eq(experiments.actionId, actionId), options);
  }

  /**
   * `expectedStatus` habilita escrita condicional (RFC-004; ARCHITECTURE_RESOLUTION.md
   * B5) sem expor `SQL` do Drizzle — a tradução para `eq()` acontece aqui dentro.
   */
  update(
    workspaceId: string,
    id: string,
    patch: Partial<ExperimentInsert>,
    expectedStatus?: ExperimentStatus,
  ): Promise<Experiment | undefined> {
    const condition = expectedStatus ? eq(experiments.status, expectedStatus) : undefined;
    return this.base.update(workspaceId, id, patch, condition);
  }

  count(workspaceId: string): Promise<number> {
    return this.base.count(workspaceId);
  }

  exists(workspaceId: string, id: string): Promise<boolean> {
    return this.base.exists(workspaceId, id);
  }
}
