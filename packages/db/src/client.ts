import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from './schema';

/**
 * Tipo do cliente Drizzle usado por toda a camada Repository.
 *
 * A instanciação real (postgres() + drizzle()), que depende de variáveis de
 * ambiente, pertence a docs/implementation/deployment/environments.md — não
 * a este arquivo. Aqui existe apenas o tipo, para que repositories e
 * transações sejam declarados sem depender de uma conexão concreta.
 */
export type Database = PostgresJsDatabase<typeof schema>;
