/**
 * VEKTOR — Drizzle Schema
 *
 * Primeiro artefato oficial de implementação da VEKTOR.
 * Traduz exatamente docs/database/logical-model.md e physical-model.md para código,
 * já incorporando as correções de ARCHITECTURE_RESOLUTION.md (A6, A11) e as
 * convenções obrigatórias de IMPLEMENTATION_STANDARDS.md, Seção 2.
 *
 * `members` (ADR-011, ADR-012 — DECISIONS.md) está presente. As colunas
 * `*_by` das demais tabelas abaixo permanecem SEM a foreign key para
 * `members.id` — essa ligação é um passo de implementação separado, não
 * parte desta mudança (fora do escopo desta tarefa).
 *
 * NÃO CONTÉM: migrations, RLS ou services — apenas o schema.
 */

import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgSchema,
  pgEnum,
  uuid,
  text,
  timestamp,
  jsonb,
  unique,
  uniqueIndex,
  index,
  foreignKey,
  check,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Enums (RFC-004 para máquinas de estado; RFC-001 para as 11 etapas fechadas)
// ---------------------------------------------------------------------------

export const strategyStatusEnum = pgEnum('strategy_status', ['ativa', 'encerrada']);

export const strategyStepTypeEnum = pgEnum('strategy_step_type', [
  'diagnostico',
  'mercado',
  'concorrentes',
  'swot',
  'icp',
  'personas',
  'jornada_cliente',
  'funis',
  'objetivos',
  'posicionamento',
  'sintese',
]);

export const campaignOriginEnum = pgEnum('campaign_origin', ['handoff', 'manual']);

export const actionStatusEnum = pgEnum('action_status', [
  'proposta',
  'aprovada',
  'em_execucao',
  'concluida',
  'publicada',
]);

export const hypothesisStatusEnum = pgEnum('hypothesis_status', [
  'registrada',
  'priorizada',
  'em_teste',
  'validada',
  'refutada',
]);

export const experimentStatusEnum = pgEnum('experiment_status', [
  'proposto',
  'aprovado',
  'em_execucao',
  'concluido',
]);

// ADR-011: status de convite/vínculo do Membro. ADR-012: os dois papéis do RBAC mínimo.
export const memberStatusEnum = pgEnum('member_status', ['convidado', 'ativo', 'removido']);
export const memberRoleEnum = pgEnum('member_role', ['admin', 'membro']);

// Sprint 4 — Execução Inteligente. Entidade nova, tratada como exceção
// explícita e aprovada (não colide com nenhuma entidade existente).
export const recommendationTypeEnum = pgEnum('recommendation_type', [
  'acao_atrasada',
  'campanha_sem_progresso',
  'muitas_acoes_abertas',
  'objetivo_sem_iniciativas',
  'evidencia_negativa',
  'kpi_abaixo_meta',
]);
export const recommendationPriorityEnum = pgEnum('recommendation_priority', ['baixa', 'media', 'alta']);
export const recommendationStatusEnum = pgEnum('recommendation_status', [
  'pendente',
  'aceita',
  'executada',
  'descartada',
]);

// ---------------------------------------------------------------------------
// workspaces — domain.md; ADR-003
// ---------------------------------------------------------------------------

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// auth.users — referência somente-leitura à tabela gerenciada pelo Supabase
// Auth (physical-model.md, "Compatibilidade com Drizzle ORM"). Nunca migrada
// por este schema; existe apenas para a FK de members.user_id apontar para
// algo tipado.
// ---------------------------------------------------------------------------

const authSchema = pgSchema('auth');

export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
});

// ---------------------------------------------------------------------------
// members — domain.md (Identity/Access, fora das nove entidades do ciclo);
// ADR-011, ADR-012 (DECISIONS.md)
// ---------------------------------------------------------------------------

export const members = pgTable(
  'members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    // A11: nunca excluir fisicamente a linha de members — se a identidade
    // Supabase for excluída, apenas o vínculo (user_id) é desfeito.
    userId: uuid('user_id').references(() => authUsers.id, { onDelete: 'set null' }),
    email: text('email').notNull(),
    status: memberStatusEnum('status').notNull().default('convidado'),
    role: memberRoleEnum('role').notNull(),
    invitedBy: uuid('invited_by'),
    invitedAt: timestamp('invited_at', { withTimezone: true }).notNull().defaultNow(),
    joinedAt: timestamp('joined_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // A6: referenciável por FK composta a partir de toda coluna `*_by` de outras tabelas.
    workspaceIdIdUnique: unique('members_workspace_id_id_unique').on(table.workspaceId, table.id),
    // ADR-011: um e-mail só tem uma linha de Membro (em qualquer status) por Workspace.
    workspaceEmailUnique: unique('members_workspace_id_email_unique').on(table.workspaceId, table.email),
    // Postgres trata NULLs como distintos em UNIQUE — múltiplos convites pendentes
    // (user_id null) convivem; um user_id real só pode aparecer uma vez por Workspace.
    workspaceUserUnique: unique('members_workspace_id_user_id_unique').on(table.workspaceId, table.userId),
    // Auto-referência (mesmo padrão de strategies.evolved_from_strategy_id): quem convidou é outro Membro do mesmo Workspace.
    invitedByFk: foreignKey({
      columns: [table.workspaceId, table.invitedBy],
      foreignColumns: [table.workspaceId, table.id],
      name: 'members_invited_by_fkey',
    }).onDelete('set null'),
    // RFC-008/ADR-014: resolver "a quais Workspaces este usuário pertence" é a
    // única consulta desta tabela que não é escopada por workspace_id — as
    // três constraints unique acima já cobrem toda consulta escopada.
    userIdx: index('members_user_id_idx').on(table.userId).where(sql`${table.userId} is not null`),
  }),
);

// ---------------------------------------------------------------------------
// strategies — domain.md; RFC-001; ADR-003; ADR-004
// (A12 — "quando a Estratégia se torna ativa" — é uma regra de negócio de
// serviço, não uma decisão de coluna; não bloqueia esta tabela.)
// ---------------------------------------------------------------------------

export const strategies = pgTable(
  'strategies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    evolvedFromStrategyId: uuid('evolved_from_strategy_id'),
    status: strategyStatusEnum('status').notNull().default('ativa'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
  },
  (table) => ({
    workspaceIdIdUnique: unique('strategies_workspace_id_id_unique').on(
      table.workspaceId,
      table.id,
    ),
    evolvedFromUnique: unique('strategies_evolved_from_strategy_id_unique').on(
      table.evolvedFromStrategyId,
    ),
    evolvedFromFk: foreignKey({
      columns: [table.workspaceId, table.evolvedFromStrategyId],
      foreignColumns: [table.workspaceId, table.id],
      name: 'strategies_evolved_from_strategy_id_fkey',
    }).onDelete('set null'),
    // ADR-003: no máximo uma Estratégia ativa por Workspace.
    onlyOneActivePerWorkspace: uniqueIndex('strategies_workspace_active_unique_idx')
      .on(table.workspaceId)
      .where(sql`${table.status} = 'ativa'`),
  }),
);

// ---------------------------------------------------------------------------
// strategy_steps — RFC-001 (Marketing Planning Framework)
// ---------------------------------------------------------------------------

export const strategySteps = pgTable(
  'strategy_steps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    strategyId: uuid('strategy_id').notNull(),
    stepType: strategyStepTypeEnum('step_type').notNull(),
    content: jsonb('content'),
    approvedBy: uuid('approved_by'), // TODO(A1): FK -> members.id, on delete set null
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => ({
    strategyFk: foreignKey({
      columns: [table.workspaceId, table.strategyId],
      foreignColumns: [strategies.workspaceId, strategies.id],
      name: 'strategy_steps_strategy_id_fkey',
    }).onDelete('cascade'),
    // RFC-001: exatamente uma linha por etapa por Estratégia.
    strategyStepTypeUnique: unique('strategy_steps_strategy_id_step_type_unique').on(
      table.strategyId,
      table.stepType,
    ),
    workspaceIdx: index('strategy_steps_workspace_id_idx').on(table.workspaceId),
  }),
);

// ---------------------------------------------------------------------------
// strategy_objectives — RFC-001 (etapa Objetivos); RFC-003 critério nº2
// ---------------------------------------------------------------------------

export const strategyObjectives = pgTable(
  'strategy_objectives',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    strategyId: uuid('strategy_id').notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    strategyFk: foreignKey({
      columns: [table.workspaceId, table.strategyId],
      foreignColumns: [strategies.workspaceId, strategies.id],
      name: 'strategy_objectives_strategy_id_fkey',
    }).onDelete('cascade'),
    // Referenciada por experiments.objective_id (FK composta).
    workspaceIdIdUnique: unique('strategy_objectives_workspace_id_id_unique').on(
      table.workspaceId,
      table.id,
    ),
    strategyIdx: index('strategy_objectives_strategy_id_idx').on(table.strategyId),
  }),
);

// ---------------------------------------------------------------------------
// campaigns — domain.md; RFC-002
// (Sem coluna de status — Bloqueador 2, RFC-004, ainda em Review; decisão de
// modelagem já registrada em logical-model.md, não reaberta aqui.)
// ---------------------------------------------------------------------------

export const campaigns = pgTable(
  'campaigns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    strategyId: uuid('strategy_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    origin: campaignOriginEnum('origin').notNull(),
    createdBy: uuid('created_by'), // TODO(A1): FK -> members.id, on delete set null
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    strategyFk: foreignKey({
      columns: [table.workspaceId, table.strategyId],
      foreignColumns: [strategies.workspaceId, strategies.id],
      name: 'campaigns_strategy_id_fkey',
    }).onDelete('restrict'),
    // Referenciada por tactics.campaign_id (FK composta).
    workspaceIdIdUnique: unique('campaigns_workspace_id_id_unique').on(
      table.workspaceId,
      table.id,
    ),
    strategyIdx: index('campaigns_strategy_id_idx').on(table.strategyId),
    workspaceIdx: index('campaigns_workspace_id_idx').on(table.workspaceId),
  }),
);

// ---------------------------------------------------------------------------
// tactics — domain.md; RFC-002
// (Sem coluna de status — mesma justificativa de campaigns.)
// ---------------------------------------------------------------------------

export const tactics = pgTable(
  'tactics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    campaignId: uuid('campaign_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    createdBy: uuid('created_by'), // TODO(A1): FK -> members.id, on delete set null
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    campaignFk: foreignKey({
      columns: [table.workspaceId, table.campaignId],
      foreignColumns: [campaigns.workspaceId, campaigns.id],
      name: 'tactics_campaign_id_fkey',
    }).onDelete('restrict'),
    // Referenciada por actions.tactic_id e experiments.tactic_id (FK composta).
    workspaceIdIdUnique: unique('tactics_workspace_id_id_unique').on(
      table.workspaceId,
      table.id,
    ),
    campaignIdx: index('tactics_campaign_id_idx').on(table.campaignId),
    workspaceIdx: index('tactics_workspace_id_idx').on(table.workspaceId),
  }),
);

// ---------------------------------------------------------------------------
// actions — domain.md; RFC-002; RFC-004 (máquina de estados)
// ---------------------------------------------------------------------------

export const actions = pgTable(
  'actions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    tacticId: uuid('tactic_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    status: actionStatusEnum('status').notNull().default('proposta'),
    approvedBy: uuid('approved_by'), // TODO(A1): FK -> members.id, on delete set null
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => ({
    tacticFk: foreignKey({
      columns: [table.workspaceId, table.tacticId],
      foreignColumns: [tactics.workspaceId, tactics.id],
      name: 'actions_tactic_id_fkey',
    }).onDelete('restrict'),
    // Referenciada por evidences.action_id e experiments.action_id (FK composta).
    workspaceIdIdUnique: unique('actions_workspace_id_id_unique').on(
      table.workspaceId,
      table.id,
    ),
    tacticIdx: index('actions_tactic_id_idx').on(table.tacticId),
    workspaceIdx: index('actions_workspace_id_idx').on(table.workspaceId),
    statusIdx: index('actions_status_idx').on(table.status),
    // RFC-002, "Rotina de execução": consulta mais frequente é Ações não concluídas.
    pendingByTacticIdx: index('actions_tactic_pending_idx')
      .on(table.tacticId)
      .where(sql`${table.status} in ('proposta', 'aprovada', 'em_execucao')`),
  }),
);

// ---------------------------------------------------------------------------
// evidences — domain.md; RFC-002 (produção); RFC-003 (consumo)
//
// ATENÇÃO — dependência circular real (evidences ↔ experiments ↔ hypotheses),
// já documentada em docs/database/migrations-strategy.md. `experiment_id` é
// declarada aqui SEM foreign key no Drizzle porque `experiments` ainda não
// existe neste ponto do arquivo (JS/TS não permite referenciar um `const`
// antes de sua inicialização).
//
// ✅ A constraint composta pendente (workspace_id, experiment_id) →
// experiments(workspace_id, id) foi adicionada via SQL puro em
// `migrations/0003_evidences_experiment_fk.sql` (Sprint de Hardening de
// Segurança, achado F1) — exatamente a sequência já descrita em
// migrations-strategy.md (Migration N → N+3). Ela existe no banco, mas
// **não está declarada aqui em Drizzle** — mover `evidences` para depois de
// `experiments` neste arquivo resolveria isso, mas é uma reordenação maior
// do que o escopo desta sprint autorizava; registrado como próximo passo,
// não como lacuna escondida.
// ---------------------------------------------------------------------------

export const evidences = pgTable(
  'evidences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    actionId: uuid('action_id'),
    experimentId: uuid('experiment_id'), // FK composta pendente — ver comentário acima
    content: jsonb('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    // Sem updatedAt: tabela append-only (domain.md; RFC-005 critério nº2).
  },
  (table) => ({
    actionFk: foreignKey({
      columns: [table.workspaceId, table.actionId],
      foreignColumns: [actions.workspaceId, actions.id],
      name: 'evidences_action_id_fkey',
    }).onDelete('cascade'),
    // Referenciada por hypotheses.evidence_id e learnings.evidence_id.
    workspaceIdIdUnique: unique('evidences_workspace_id_id_unique').on(
      table.workspaceId,
      table.id,
    ),
    actionIdx: index('evidences_action_id_idx')
      .on(table.actionId)
      .where(sql`${table.actionId} is not null`),
    experimentIdx: index('evidences_experiment_id_idx')
      .on(table.experimentId)
      .where(sql`${table.experimentId} is not null`),
    workspaceIdx: index('evidences_workspace_id_idx').on(table.workspaceId),
    // Posse polimórfica: exatamente uma origem (Ação OU Experimento).
    exactlyOneOrigin: check(
      'evidences_exactly_one_origin_check',
      sql`num_nonnulls(${table.actionId}, ${table.experimentId}) = 1`,
    ),
  }),
);

// ---------------------------------------------------------------------------
// hypotheses — domain.md; RFC-003; RFC-004 (máquina de estados)
// ---------------------------------------------------------------------------

export const hypotheses = pgTable(
  'hypotheses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    evidenceId: uuid('evidence_id').notNull(),
    description: text('description').notNull(),
    status: hypothesisStatusEnum('status').notNull().default('registrada'),
    createdBy: uuid('created_by'), // TODO(A1): FK -> members.id, on delete set null
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => ({
    evidenceFk: foreignKey({
      columns: [table.workspaceId, table.evidenceId],
      foreignColumns: [evidences.workspaceId, evidences.id],
      name: 'hypotheses_evidence_id_fkey',
    }).onDelete('restrict'),
    // Referenciada por experiments.hypothesis_id (FK composta).
    workspaceIdIdUnique: unique('hypotheses_workspace_id_id_unique').on(
      table.workspaceId,
      table.id,
    ),
    evidenceIdx: index('hypotheses_evidence_id_idx').on(table.evidenceId),
    workspaceIdx: index('hypotheses_workspace_id_idx').on(table.workspaceId),
    statusIdx: index('hypotheses_status_idx').on(table.status),
    // RFC-003, "Participação da IA": priorização entre Hipóteses concorrentes.
    prioritizedIdx: index('hypotheses_workspace_prioritized_idx')
      .on(table.workspaceId)
      .where(sql`${table.status} = 'priorizada'`),
  }),
);

// ---------------------------------------------------------------------------
// experiments — domain.md; RFC-002 (execução); RFC-003 (origem); RFC-004
// ---------------------------------------------------------------------------

export const experiments = pgTable(
  'experiments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    hypothesisId: uuid('hypothesis_id').notNull(),
    objectiveId: uuid('objective_id').notNull(),
    tacticId: uuid('tactic_id'),
    actionId: uuid('action_id'),
    status: experimentStatusEnum('status').notNull().default('proposto'),
    // TODO(A1 + A9 do Grupo A): FK -> members.id pendente; ver nota abaixo
    // sobre por que esta coluna não pode ser tratada como neutra até o
    // Bloqueador 3 (RFC-003/004) fechar em Review — ARCHITECTURE_RESOLUTION
    // B3 já registra essa ressalva.
    approvedBy: uuid('approved_by'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => ({
    hypothesisFk: foreignKey({
      columns: [table.workspaceId, table.hypothesisId],
      foreignColumns: [hypotheses.workspaceId, hypotheses.id],
      name: 'experiments_hypothesis_id_fkey',
    }).onDelete('restrict'),
    objectiveFk: foreignKey({
      columns: [table.workspaceId, table.objectiveId],
      foreignColumns: [strategyObjectives.workspaceId, strategyObjectives.id],
      name: 'experiments_objective_id_fkey',
    }).onDelete('restrict'),
    tacticFk: foreignKey({
      columns: [table.workspaceId, table.tacticId],
      foreignColumns: [tactics.workspaceId, tactics.id],
      name: 'experiments_tactic_id_fkey',
    }).onDelete('restrict'),
    actionFk: foreignKey({
      columns: [table.workspaceId, table.actionId],
      foreignColumns: [actions.workspaceId, actions.id],
      name: 'experiments_action_id_fkey',
    }).onDelete('restrict'),
    // Referenciada por evidences.experiment_id (FK composta pendente, ver evidences).
    workspaceIdIdUnique: unique('experiments_workspace_id_id_unique').on(
      table.workspaceId,
      table.id,
    ),
    hypothesisIdx: index('experiments_hypothesis_id_idx').on(table.hypothesisId),
    objectiveIdx: index('experiments_objective_id_idx').on(table.objectiveId),
    tacticIdx: index('experiments_tactic_id_idx')
      .on(table.tacticId)
      .where(sql`${table.tacticId} is not null`),
    actionIdx: index('experiments_action_id_idx')
      .on(table.actionId)
      .where(sql`${table.actionId} is not null`),
    workspaceIdx: index('experiments_workspace_id_idx').on(table.workspaceId),
    statusIdx: index('experiments_status_idx').on(table.status),
    // Fila de Experimentos aguardando decisão de aprovação (Bloqueador 3).
    pendingApprovalIdx: index('experiments_workspace_pending_idx')
      .on(table.workspaceId)
      .where(sql`${table.status} = 'proposto'`),
    // Posse polimórfica: exatamente uma origem (Tática OU Ação).
    exactlyOneOwner: check(
      'experiments_exactly_one_owner_check',
      sql`num_nonnulls(${table.tacticId}, ${table.actionId}) = 1`,
    ),
  }),
);

// ---------------------------------------------------------------------------
// learnings — domain.md; RFC-005
// ---------------------------------------------------------------------------

export const learnings = pgTable(
  'learnings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    evidenceId: uuid('evidence_id').notNull(),
    content: jsonb('content').notNull(),
    createdBy: uuid('created_by'), // TODO(A1): FK -> members.id, on delete set null
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    // Sem updatedAt: tabela append-only (RFC-005 critério nº2).
  },
  (table) => ({
    evidenceFk: foreignKey({
      columns: [table.workspaceId, table.evidenceId],
      foreignColumns: [evidences.workspaceId, evidences.id],
      name: 'learnings_evidence_id_fkey',
    }).onDelete('restrict'),
    evidenceIdx: index('learnings_evidence_id_idx').on(table.evidenceId),
    workspaceIdx: index('learnings_workspace_id_idx').on(table.workspaceId),
    // RFC-006/RFC-007: leitura por agregação cronológica (Biblioteca/Relatórios).
    createdAtIdx: index('learnings_created_at_idx').on(table.createdAt),
  }),
);

// ---------------------------------------------------------------------------
// integrations — RFC-008; Implementation Plan Fase 9
// ---------------------------------------------------------------------------

export const integrations = pgTable(
  'integrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // sem enum: RFC-008 não fecha os tipos possíveis
    configuration: jsonb('configuration').notNull(),
    createdBy: uuid('created_by'), // TODO(A1): FK -> members.id, on delete set null
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    workspaceIdx: index('integrations_workspace_id_idx').on(table.workspaceId),
  }),
);

// ---------------------------------------------------------------------------
// execution_recommendations — Sprint 4 (Execução Inteligente)
//
// Entidade nova, aprovada como exceção explícita: recomendações geradas por
// um motor de análise (hoje um Fake Provider determinístico, preparado para
// um provedor de IA real depois) precisam de um status rastreável entre
// visitas (Pendente/Aceita/Executada/Descartada) — isso não é representável
// em nenhuma tabela existente sem alterar o domínio já aprovado
// (Campaigns/Tactics/Actions/Evidence/Objectives/Experiments permanecem
// intocados). Nunca escreve nessas tabelas — só lê delas.
// ---------------------------------------------------------------------------

export const executionRecommendations = pgTable(
  'execution_recommendations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    strategyId: uuid('strategy_id').notNull(),
    type: recommendationTypeEnum('type').notNull(),
    priority: recommendationPriorityEnum('priority').notNull(),
    justification: text('justification').notNull(),
    // Snapshot dos ids relevantes que originaram a recomendação (ex.: campaignId, actionId) — só leitura, nunca reidratado como FK.
    context: jsonb('context').notNull(),
    suggestedAction: text('suggested_action').notNull(),
    status: recommendationStatusEnum('status').notNull().default('pendente'),
    // Chave determinística (ex.: `acao_atrasada:{actionId}`) usada só para evitar recomendação duplicada enquanto `status = 'pendente'`.
    dedupeKey: text('dedupe_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  (table) => ({
    strategyFk: foreignKey({
      columns: [table.workspaceId, table.strategyId],
      foreignColumns: [strategies.workspaceId, strategies.id],
      name: 'execution_recommendations_strategy_id_fkey',
    }).onDelete('cascade'),
    workspaceIdIdUnique: unique('execution_recommendations_workspace_id_id_unique').on(
      table.workspaceId,
      table.id,
    ),
    workspaceIdx: index('execution_recommendations_workspace_id_idx').on(table.workspaceId),
    strategyIdx: index('execution_recommendations_strategy_id_idx').on(table.strategyId),
    statusIdx: index('execution_recommendations_status_idx').on(table.status),
    // Impede duas recomendações pendentes com a mesma causa — permite recorrência depois de aceita/descartada.
    pendingDedupeUnique: uniqueIndex('execution_recommendations_pending_dedupe_unique')
      .on(table.workspaceId, table.dedupeKey)
      .where(sql`${table.status} = 'pendente'`),
  }),
);
