import { and, count as countRows, eq, type InferInsertModel, type InferSelectModel, type SQL } from 'drizzle-orm';
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';
import type { DbClient } from '../transaction';

/**
 * Público — usado por qualquer Service para paginar. Não contém nada
 * específico do Drizzle: nenhum Service precisa importar `drizzle-orm` para
 * preencher isto.
 */
export interface ListOptions {
  limit?: number;
  offset?: number;
}

/** Limite aplicado quando o chamador não especifica um — nunca aplicado sem que `total` também seja informado. */
const DEFAULT_LIST_LIMIT = 100;

/**
 * Uma única expressão de ordenação (`desc(table.createdAt)`) ou uma lista,
 * para ordenação composta (`[desc(table.status), asc(table.createdAt)]`) —
 * mesma forma que `.orderBy(...)` do Drizzle já aceita nativamente. Um único
 * `SQL` continua funcionando exatamente como antes; a lista é só para
 * evoluções futuras que ainda não têm nenhum chamador.
 */
type OrderBy = SQL | SQL[];

/**
 * Retorno de toda listagem da camada Repository. `items.length` pode ser
 * menor que `total` — isso é paginação visível, não truncamento silencioso:
 * o chamador sempre consegue detectar e, se precisar, buscar o restante com
 * `offset`. Nenhum método de listagem desta camada retorna um array puro.
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Operações de persistência comuns a toda entidade escopada por Workspace.
 * Nenhum método decide QUANDO uma operação é permitida — apenas COMO ela é
 * executada. Regra de negócio pertence a Services, nunca a esta camada
 * (IMPLEMENTATION_STANDARDS.md, Seção 3).
 *
 * Usada por COMPOSIÇÃO, nunca por herança: cada repositório de entidade tem
 * uma instância privada desta classe e delega apenas os métodos que fazem
 * sentido para aquela entidade (ex.: `evidences`/`learnings` nunca delegam
 * `update`; nenhuma entidade além de `integrations` delega `delete` — ver
 * comentário em cada repositório). Herança exporia sempre a superfície
 * inteira, violando Liskov sempre que um método não fizesse sentido para a
 * subclasse.
 *
 * `idColumn`/`workspaceIdColumn` são injetadas pelo chamador em vez de
 * exigidas por um constraint estrutural em `TTable` — evita depender de
 * generics internos do Drizzle para "tabela com id e workspace_id".
 *
 * `tableRef` existe porque o `.from()`/`.insert()`/`.update()`/`.delete()`
 * do Drizzle não resolvem um `TTable` genérico não instanciado (erro de tipo
 * interno do Drizzle sobre `TableLikeHasEmptySelection`); o downcast para o
 * tipo concreto `PgTable` resolve isso sem recorrer a `any`.
 */
export class BaseRepository<
  TTable extends PgTable,
  TSelect extends Record<string, unknown> = InferSelectModel<TTable>,
  TInsert extends Record<string, unknown> = InferInsertModel<TTable>,
> {
  constructor(
    protected readonly db: DbClient,
    protected readonly table: TTable,
    protected readonly idColumn: AnyPgColumn,
    protected readonly workspaceIdColumn: AnyPgColumn,
  ) {}

  private get tableRef(): PgTable {
    return this.table;
  }

  async create(input: TInsert): Promise<TSelect> {
    const rows = await this.db
      .insert(this.tableRef)
      .values(input as InferInsertModel<TTable>)
      .returning();
    const row = rows[0];
    if (!row) {
      throw new Error('Insert não retornou nenhuma linha.');
    }
    return row as unknown as TSelect;
  }

  async findById(workspaceId: string, id: string): Promise<TSelect | undefined> {
    const rows = await this.db
      .select()
      .from(this.tableRef)
      .where(and(eq(this.workspaceIdColumn, workspaceId), eq(this.idColumn, id)))
      .limit(1);
    return rows[0] as unknown as TSelect | undefined;
  }

  async exists(workspaceId: string, id: string): Promise<boolean> {
    const row = await this.findById(workspaceId, id);
    return row !== undefined;
  }

  /**
   * `orderBy` opcional (novo parâmetro, default `undefined`) — retrocompatível
   * com todo chamador existente, que continua sem ordenação garantida.
   * Repositórios de entidade que precisam de "mais recentes primeiro"
   * (Dashboard de Execução) passam `desc(table.createdAt)` explicitamente;
   * os demais permanecem exatamente como estavam.
   */
  async findByWorkspace(
    workspaceId: string,
    options: ListOptions = {},
    orderBy?: OrderBy,
  ): Promise<PaginatedResult<TSelect>> {
    return this.findMany(workspaceId, undefined, options, orderBy);
  }

  /**
   * Base para listagens mais específicas de uma subclasse (ex.:
   * `findByStrategy`) — `extra` é sempre combinado com `workspace_id`, nunca
   * o substitui, para que nenhuma subclasse consiga esquecer o isolamento
   * de tenant.
   *
   * `extra` e `orderBy` são `SQL` do Drizzle de propósito — este método não
   * é exportado do pacote (`index.ts` não reexporta `BaseRepository`), só é
   * alcançável pelos arquivos desta pasta, que já traduzem tipos de domínio
   * (um `strategyId`, um enum de status) para `SQL` antes de chegar aqui.
   * Nenhum Service enxerga este parâmetro.
   *
   * `total` é calculado com a mesma condição da página, em paralelo com a
   * própria busca — o chamador nunca recebe uma lista cortada sem saber que
   * ela foi cortada.
   */
  async findMany(
    workspaceId: string,
    extra?: SQL,
    options: ListOptions = {},
    orderBy?: OrderBy,
  ): Promise<PaginatedResult<TSelect>> {
    const condition = extra
      ? and(eq(this.workspaceIdColumn, workspaceId), extra)
      : eq(this.workspaceIdColumn, workspaceId);
    const limit = options.limit ?? DEFAULT_LIST_LIMIT;
    const offset = options.offset ?? 0;

    const baseQuery = this.db.select().from(this.tableRef).where(condition);
    const orderedQuery = orderBy
      ? baseQuery.orderBy(...(Array.isArray(orderBy) ? orderBy : [orderBy]))
      : baseQuery;

    const [rows, totalRows] = await Promise.all([
      orderedQuery.limit(limit).offset(offset),
      this.db.select({ value: countRows() }).from(this.tableRef).where(condition),
    ]);

    return {
      items: rows as unknown as TSelect[],
      total: totalRows[0]?.value ?? 0,
      limit,
      offset,
    };
  }

  /**
   * `extra` permite escrita condicional (ex.: `eq(actions.status, 'proposta')`)
   * para evitar a corrida de dupla transição já registrada em
   * ARCHITECTURE_RESOLUTION.md (B5): se a condição não bater mais com o
   * estado atual da linha, nenhuma linha é afetada e o retorno é
   * `undefined` em vez de sobrescrever uma transição concorrente. Não é
   * regra de negócio — o repositório não sabe o que a condição representa.
   *
   * `SQL` aqui é seguro pelo mesmo motivo de `findMany`: este método não é
   * público do pacote. Os repositórios de entidade que precisam de escrita
   * condicional expõem, na própria assinatura pública, um valor de domínio
   * (ex.: o status esperado) e montam o `eq()` internamente antes de chamar
   * este método.
   */
  async update(
    workspaceId: string,
    id: string,
    patch: Partial<TInsert>,
    extra?: SQL,
  ): Promise<TSelect | undefined> {
    const condition = extra
      ? and(eq(this.workspaceIdColumn, workspaceId), eq(this.idColumn, id), extra)
      : and(eq(this.workspaceIdColumn, workspaceId), eq(this.idColumn, id));
    const rows = await this.db
      .update(this.tableRef)
      .set(patch as Partial<InferInsertModel<TTable>>)
      .where(condition)
      .returning();
    return rows[0] as unknown as TSelect | undefined;
  }

  async delete(workspaceId: string, id: string): Promise<void> {
    await this.db
      .delete(this.tableRef)
      .where(and(eq(this.workspaceIdColumn, workspaceId), eq(this.idColumn, id)));
  }

  async count(workspaceId: string): Promise<number> {
    const rows = await this.db
      .select({ value: countRows() })
      .from(this.tableRef)
      .where(eq(this.workspaceIdColumn, workspaceId));
    return rows[0]?.value ?? 0;
  }
}
