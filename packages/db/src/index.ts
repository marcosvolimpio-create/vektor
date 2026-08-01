// Entry point público de @vektor/db. Expõe apenas repositories e tipos
// públicos — nunca o schema Drizzle bruto nem o client de conexão, que
// existem para uso interno da camada e para infraestrutura/migrations via
// subpaths dedicados (`@vektor/db/schema`, `@vektor/db/client`).
export type { ListOptions, PaginatedResult } from './repositories/base.repository';
export type { DbClient, Transaction } from './transaction';

export * from './repositories/workspaces.repository';
export * from './repositories/members.repository';
export * from './repositories/strategies.repository';
export * from './repositories/strategy-steps.repository';
export * from './repositories/strategy-objectives.repository';
export * from './repositories/campaigns.repository';
export * from './repositories/tactics.repository';
export * from './repositories/actions.repository';
export * from './repositories/evidences.repository';
export * from './repositories/hypotheses.repository';
export * from './repositories/experiments.repository';
export * from './repositories/learnings.repository';
export * from './repositories/integrations.repository';
export * from './repositories/execution-recommendations.repository';
