import { createDatabaseConnection } from '@vektor/db/connection';
import type { Database } from '@vektor/db/client';

/**
 * Única instância de conexão do processo — reconstruí-la a cada chamada
 * abriria uma conexão Postgres nova por requisição. `DATABASE_URL` é a única
 * variável de ambiente que a borda da aplicação precisa conhecer;
 * `@vektor/db` decide o resto (driver, pool, schema).
 */
let database: Database | undefined;

export function getDb(): Database {
  if (!database) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL não está definida.');
    }
    database = createDatabaseConnection(connectionString);
  }
  return database;
}
