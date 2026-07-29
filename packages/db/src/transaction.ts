import type { Database } from './client';

/**
 * Tipo do objeto de transação passado ao callback de `db.transaction(...)`.
 * Extraído diretamente da assinatura de `Database['transaction']` (em vez de
 * reconstruído à mão) para não depender de generics internos do Drizzle que
 * mudam entre versões.
 */
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

/**
 * Todo repository aceita `Database` (fora de uma transação) ou `Transaction`
 * (dentro de um `db.transaction(async (tx) => { ... })`) — a mesma instância
 * de repository pode ser reconstruída com `tx` para operações que precisam
 * ser atômicas entre agregados (ex.: Evoluir Estratégia).
 */
export type DbClient = Database | Transaction;
