import { sql } from 'drizzle-orm';
import { MembersRepository, type DbClient } from '@vektor/db';
import {
  AprendizadoService,
  ConfiguracoesService,
  EstrategiaService,
  ExecucaoService,
  GrowthService,
  WorkspaceService,
  resolveActorContext,
  type ActorContext,
  type EstrategiaEvolucaoFactory,
  type MembersRepositoryFactory,
} from '@vektor/services';
import { getDb } from './db';

/**
 * Composition Root — o único lugar do monorepo onde `MembersRepository`
 * concreto (`@vektor/db`) é ligado ao `MembersRepositoryPort` que os Services
 * esperam, e o único lugar que abre a transação de banco de cada requisição
 * (ADR-014). Nenhum Service, Server Action ou outro módulo chama
 * `getDb()`/`db.transaction(...)` diretamente — só este arquivo.
 */
const membersRepositoryFactory: MembersRepositoryFactory = (db: DbClient) => new MembersRepository(db);

/**
 * ADR-014: toda Server Action executa dentro de UMA transação Postgres que
 * já nasce com `role = authenticated` e a variável de sessão equivalente a
 * `auth.uid()` definidas — nunca com o papel da conexão base (o que
 * equivaleria, na prática, a `service_role` em caminho de usuário final,
 * Regra Absoluta nº3). É a única chamada a `db.transaction(...)` de nível de
 * requisição em todo o projeto; qualquer `.transaction()` aberta dentro de
 * um Service, a partir daqui, vira um savepoint desta mesma transação — o
 * `SET LOCAL` já aplicado é herdado automaticamente, sem repeti-lo.
 */
export async function runInRequestContext<T>(
  userId: string,
  callback: (tx: DbClient) => Promise<T>,
): Promise<T> {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`set local role authenticated`);
    const claims = JSON.stringify({ sub: userId });
    await tx.execute(sql`select set_config('request.jwt.claims', ${claims}, true)`);
    return callback(tx);
  });
}

export function createWorkspaceService(dbClient: DbClient): WorkspaceService {
  return new WorkspaceService(dbClient, membersRepositoryFactory);
}

export function createEstrategiaService(dbClient: DbClient): EstrategiaService {
  return new EstrategiaService(dbClient, membersRepositoryFactory);
}

export function createConfiguracoesService(dbClient: DbClient): ConfiguracoesService {
  return new ConfiguracoesService(dbClient, membersRepositoryFactory);
}

/**
 * `ExecucaoService` não recebe `membersRepositoryFactory`: nenhuma operação
 * de Execução exige `role = 'admin'` (ADR-012) — ver auditoria aprovada. A
 * validação de "Estratégia ativa" é feita via `EstrategiaService`, composto
 * aqui com a mesma `dbClient` da requisição.
 */
export function createExecucaoService(dbClient: DbClient): ExecucaoService {
  return new ExecucaoService(dbClient, createEstrategiaService(dbClient));
}

/**
 * `GrowthService` recebe `membersRepositoryFactory` porque `aprovarExperimento`
 * é admin-gated (ADR-012) — mesmo motivo de `ConfiguracoesService`/
 * `EstrategiaService`.
 */
export function createGrowthService(dbClient: DbClient): GrowthService {
  return new GrowthService(dbClient, createEstrategiaService(dbClient), membersRepositoryFactory);
}

/**
 * `EstrategiaService` já satisfaz `EstrategiaEvolucaoPort` estruturalmente —
 * nenhum adaptador é necessário. `AprendizadoService` nunca importa
 * `EstrategiaService` concretamente, só este tipo de fábrica (mesmo padrão
 * de `membersRepositoryFactory`).
 */
const estrategiaEvolucaoFactory: EstrategiaEvolucaoFactory = (db: DbClient) => createEstrategiaService(db);

/**
 * `AprendizadoService` recebe `membersRepositoryFactory` porque
 * `evoluirEstrategia` é admin-gated (ADR-012) — mesmo motivo de
 * `GrowthService`/`ConfiguracoesService`.
 */
export function createAprendizadoService(dbClient: DbClient): AprendizadoService {
  return new AprendizadoService(dbClient, estrategiaEvolucaoFactory, membersRepositoryFactory);
}

/**
 * ADR-014/A4: usa a transação já contextualizada (`tx`) da requisição atual
 * — nunca abre ou busca uma conexão própria. `userId` vem sempre de
 * `getAuthenticatedUser()`, nunca de um parâmetro do cliente.
 */
export async function resolveRequestActorContext(
  tx: DbClient,
  userId: string,
  workspaceId: string,
): Promise<ActorContext> {
  return resolveActorContext(membersRepositoryFactory(tx), userId, workspaceId);
}
