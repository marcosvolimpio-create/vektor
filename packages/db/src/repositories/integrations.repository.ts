import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { DbClient } from '../transaction';
import { integrations } from '../schema';
import { BaseRepository, type ListOptions, type PaginatedResult } from './base.repository';

export type Integration = InferSelectModel<typeof integrations>;
export type NewIntegration = InferInsertModel<typeof integrations>;

/**
 * RFC-008; Implementation Plan Fase 9. Única entidade do domínio com
 * `delete` documentado (docs/database/rls-policies.md: "remover uma
 * integração é uma operação razoável e sem contraindicação em nenhuma
 * fonte") — por isso é a única repository que expõe os 8 métodos completos.
 */
export class IntegrationsRepository {
  private readonly base: BaseRepository<typeof integrations, Integration, NewIntegration>;

  constructor(db: DbClient) {
    this.base = new BaseRepository(db, integrations, integrations.id, integrations.workspaceId);
  }

  create(input: NewIntegration): Promise<Integration> {
    return this.base.create(input);
  }

  findById(workspaceId: string, id: string): Promise<Integration | undefined> {
    return this.base.findById(workspaceId, id);
  }

  findByWorkspace(workspaceId: string, options?: ListOptions): Promise<PaginatedResult<Integration>> {
    return this.base.findByWorkspace(workspaceId, options);
  }

  update(workspaceId: string, id: string, patch: Partial<NewIntegration>): Promise<Integration | undefined> {
    return this.base.update(workspaceId, id, patch);
  }

  delete(workspaceId: string, id: string): Promise<void> {
    return this.base.delete(workspaceId, id);
  }

  count(workspaceId: string): Promise<number> {
    return this.base.count(workspaceId);
  }

  exists(workspaceId: string, id: string): Promise<boolean> {
    return this.base.exists(workspaceId, id);
  }
}
