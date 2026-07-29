import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import type { Database } from './client';

/**
 * Única função de instanciação real de conexão (`postgres()` + `drizzle()`)
 * do pacote. `client.ts` permanece apenas o tipo — para que repositories e
 * transações continuem declaráveis sem depender de uma conexão concreta —
 * esta função existe para que a borda da aplicação (Composition Root) não
 * precise conhecer `drizzle-orm`/`postgres` diretamente, só `DATABASE_URL`.
 */
export function createDatabaseConnection(connectionString: string): Database {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}
