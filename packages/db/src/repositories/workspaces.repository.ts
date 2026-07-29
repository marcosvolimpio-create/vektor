import { count as countRows, eq, type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import type { DbClient } from '../transaction';
import { workspaces } from '../schema';
import { type ListOptions, type PaginatedResult } from './base.repository';

export type Workspace = InferSelectModel<typeof workspaces>;
export type NewWorkspace = InferInsertModel<typeof workspaces>;

const DEFAULT_LIST_LIMIT = 100;

/**
 * Workspace é a raiz de tenant (architecture/domain.md) — não tem
 * `workspace_id` próprio, então não usa `BaseRepository`. Quem pode criar um
 * Workspace e como (item A5 de ARCHITECTURE_RESOLUTION.md) é decisão de
 * Produto/Service, não desta camada.
 *
 * Sem `update`/`delete`: nenhuma fonte documenta edição ou remoção de um
 * Workspace após criado.
 */
export class WorkspacesRepository {
  constructor(private readonly db: DbClient) {}

  async create(input: NewWorkspace): Promise<Workspace> {
    const rows = await this.db.insert(workspaces).values(input).returning();
    const row = rows[0];
    if (!row) {
      throw new Error('Insert não retornou nenhuma linha.');
    }
    return row;
  }

  async findById(id: string): Promise<Workspace | undefined> {
    const rows = await this.db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
    return rows[0];
  }

  /** Reusa o mesmo formato paginado de toda a camada — ver base.repository.ts. */
  async findMany(options: ListOptions = {}): Promise<PaginatedResult<Workspace>> {
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;
    const [items, totalRows] = await Promise.all([
      this.db.select().from(workspaces).limit(limit).offset(offset),
      this.db.select({ value: countRows() }).from(workspaces),
    ]);
    return { items, total: totalRows[0]?.value ?? 0, limit, offset };
  }

  async exists(id: string): Promise<boolean> {
    const row = await this.findById(id);
    return row !== undefined;
  }

  async count(): Promise<number> {
    const rows = await this.db.select({ value: countRows() }).from(workspaces);
    return rows[0]?.value ?? 0;
  }
}
