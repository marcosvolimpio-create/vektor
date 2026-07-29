# Modelo Lógico

> Parte do [Modelo de Dados VEKTOR](./README.md). Ver legenda de símbolos (🔒/⚠️/🚧) no README. Tipos usam nomenclatura Postgres; ver [`physical-model.md`](./physical-model.md) para a tradução em Drizzle.

Convenções aplicadas a todas as tabelas, não repetidas em cada seção:

- Chave primária: `id uuid`, gerada por padrão (`gen_random_uuid()`).
- `workspace_id uuid not null` presente em **toda** tabela (inclusive as que já chegam ao Workspace por um caminho indireto, ex.: `tactics`) — denormalização deliberada para que toda política de RLS seja uma comparação direta de coluna, sem join multi-nível. Ver `physical-model.md`, "Denormalização de `workspace_id`".
- `created_at timestamptz not null default now()` em todas as tabelas.
- `updated_at timestamptz` presente apenas em tabelas cujo conteúdo é revisável (ver por tabela); ausente em tabelas append-only (`evidences`, `learnings`) — coerente com RFC-005, critério nº2 ("nenhuma entrada de Aprendizado é descartada") e com `domain.md` ("Evidência: o registro bruto do que aconteceu").
- Toda coluna `*_by uuid` referencia `members.id` — ✅ ratificado por ADR-011 (`DECISIONS.md`); a FK composta `(workspace_id, members.id)` é adicionada na implementação, quando a tabela `members` existir.

---

## `workspaces`

**Origem:** `architecture/domain.md` ("Workspace: o limite de tenant"); ADR-003.
**Responsabilidade:** raiz de isolamento multi-tenant. Nenhuma linha de nenhuma outra tabela existe sem um `workspace_id` válido.
**Relacionamentos:** pai de todas as demais tabelas.

| Coluna | Tipo | Constraint |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | not null |
| `created_at` | timestamptz | not null default now() |

**Regras de integridade:** nenhuma além de existência — Workspace não tem estado nem ciclo de vida documentado além de "existe".
**Constraints:** nenhuma além da PK.
**Índices:** nenhum além do implícito da PK (tabela pequena, cardinalidade baixa — um Workspace por empresa cliente).
**Otimizações possíveis:** nenhuma relevante neste volume esperado.

---

## `members`

**Origem:** ✅ ADR-011, ADR-012 (`DECISIONS.md`) — Membro não é uma das nove entidades oficiais; existe como Identity/Access fora do ciclo (`architecture/domain.md` permanece inalterado). RFC-008 ("convidar equipe").
**Responsabilidade:** ligar uma identidade autenticada (Supabase Auth) a um Workspace, representando quem executa ações humanas na plataforma.
**Relacionamentos:** pertence a um `workspace`; referencia `auth.users` (schema gerenciado pelo Supabase, fora do controle do Drizzle) quando aceita; referenciada por toda coluna `*_by` das demais tabelas.

| Coluna | Tipo | Constraint |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | not null, FK → `workspaces.id`, `on delete cascade` |
| `user_id` | uuid | **nullable** — FK → `auth.users.id`, `on delete set null` (ADR-011; preserva a linha de Membro mesmo se a identidade Supabase for excluída — Regra Absoluta nº8) |
| `email` | text | not null — alvo do convite; preenchido desde a criação da linha, permanece após aceite (ADR-011) |
| `status` | enum `member_status` (`convidado`, `ativo`, `removido`) | not null default `convidado` — ADR-011; `user_id` é populado e `joined_at` preenchido somente na transição `convidado → ativo` |
| `role` | enum `member_role` (`admin`, `membro`) | not null — ✅ ADR-012 (dois papéis; mapeamento completo de operação→autoridade mínima em `DECISIONS.md`) |
| `invited_by` | uuid | nullable, FK → `members.id`, `on delete set null` (ADR-011; segue o mesmo padrão `*_by` de A11) |
| `invited_at` | timestamptz | not null default now() |
| `joined_at` | timestamptz | nullable |
| `created_at` | timestamptz | not null default now() |

**Regras de integridade:** um usuário (`user_id`) não pode ter mais de uma linha de membership por Workspace; um `email` não pode ter mais de uma linha de membership pendente/ativa por Workspace.
**Constraints:** `unique (workspace_id, user_id)` onde `user_id` não é nulo; `unique (workspace_id, email)`; `unique (workspace_id, id)` — necessária para ser referenciável por FK composta `(workspace_id, id)` a partir de toda coluna `*_by` (A6).
**Índices:** índice em `user_id` (consulta "a quais Workspaces este usuário pertence"); índice em `workspace_id` (padrão de toda tabela, ver convenções); índice em `email` (consulta de convite pendente).
**Otimizações possíveis:** nenhuma até o volume de usuários por Workspace crescer significativamente — RFC-008 não documenta limite.

---

## `strategies`

**Origem:** `architecture/domain.md`; RFC-001; ADR-003 (uma ativa por Workspace); ADR-004 (encerrada nunca recebe nova Execução).
**Responsabilidade:** registrar a intenção estratégica do Workspace; raiz de toda Execução.
**Relacionamentos:** pertence a um `workspace`; auto-referência opcional para a Estratégia da qual evoluiu; pai de `strategy_steps`, `strategy_objectives`, `campaigns`.

| Coluna | Tipo | Constraint |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | not null, FK → `workspaces.id`, `on delete cascade` |
| `evolved_from_strategy_id` | uuid | nullable, FK → `strategies.id`, `on delete set null` — ⚠️ inferência (linhagem entre ciclos, RFC-005) |
| `status` | enum `strategy_status` (`ativa`, `encerrada`) | not null default `ativa` |
| `created_at` | timestamptz | not null default now() |
| `closed_at` | timestamptz | nullable |

**Regras de integridade:**
- ADR-003: no máximo uma linha com `status = 'ativa'` por `workspace_id`.
- ADR-004: uma Estratégia com `status = 'encerrada'` nunca deve ser referenciada como `strategy_id` em uma nova linha de `campaigns` (regra de aplicação — ver `backend/validation.md` em `docs/implementation/`, não expressável como CHECK simples porque depende de outra tabela).

**Constraints:** `unique (evolved_from_strategy_id)` onde não nulo — preserva a cadeia linear (uma Estratégia só pode ser sucedida por, no máximo, uma próxima), evitando ramificação.
**Índices:** índice parcial `(workspace_id) where status = 'ativa'` — suporta diretamente a consulta mais frequente do produto: "qual é a Estratégia ativa deste Workspace" (Seletor de Estratégia Ativa, `architecture/navigation.md`).
**Otimizações possíveis:** o índice parcial acima já é a otimização mais relevante; também reforça, em nível de índice único (`unique` sobre o índice parcial), a regra ADR-003 diretamente no banco — ver `physical-model.md`.

---

## `strategy_steps`

**Origem:** RFC-001 (Marketing Planning Framework, tabela das 11 etapas com ordem de dependência).
**Responsabilidade:** conteúdo estruturado de cada uma das 11 etapas de formulação de uma Estratégia.
**Relacionamentos:** pertence a uma `strategy`; aprovada por um `member`.

| Coluna | Tipo | Constraint |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | not null, FK → `workspaces.id`, `on delete cascade` |
| `strategy_id` | uuid | not null, FK → `strategies.id`, `on delete cascade` |
| `step_type` | enum `strategy_step_type` (`diagnostico`, `mercado`, `concorrentes`, `swot`, `icp`, `personas`, `jornada_cliente`, `funis`, `objetivos`, `posicionamento`, `sintese`) | not null |
| `content` | jsonb | nullable até a etapa ser preenchida |
| `approved_by` | uuid | nullable, FK → `members.id` — ✅ ADR-011 (Membro), ADR-012 (exige `role = 'admin'`) |
| `approved_at` | timestamptz | nullable |
| `created_at` | timestamptz | not null default now() |
| `updated_at` | timestamptz | nullable |

**Regras de integridade:**
- RFC-001, critério nº2: uma etapa só avança/aprova depois que suas dependências (tabela de dependência entre as 11 etapas, RFC-001) estiverem preenchidas — regra de aplicação, não expressável em CHECK simples (depende do conteúdo de outras linhas).
- Exatamente uma linha por `(strategy_id, step_type)`.

**Constraints:** `unique (strategy_id, step_type)`.
**Índices:** `(strategy_id, step_type)` (coberto pela unique acima, reutilizável como índice de consulta).
**Otimizações possíveis:** se o `content` jsonb crescer para busca textual (não documentado, fora do escopo desta modelagem), considerar índice GIN — não incluído agora por ausência de requisito confirmado.

---

## `strategy_objectives`

**Origem:** RFC-001 (etapa "Objetivos"); RFC-003, critério nº2 ("todo Experimento declara... a qual Objetivo... ele serve" — exige um Objetivo referenciável individualmente, não um texto solto).
**Responsabilidade:** tornar cada objetivo individual da etapa "Objetivos" referenciável por chave estrangeira.
**Relacionamentos:** pertence a uma `strategy`; referenciada por `experiments`.

| Coluna | Tipo | Constraint |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | not null, FK → `workspaces.id`, `on delete cascade` |
| `strategy_id` | uuid | not null, FK → `strategies.id`, `on delete cascade` |
| `description` | text | not null |
| `created_at` | timestamptz | not null default now() |

**Regras de integridade:** nenhuma além do vínculo com uma Estratégia — RFC-001 não define um limite de quantidade de objetivos por Estratégia.
**Constraints:** nenhuma além das FKs.
**Índices:** `strategy_id` (padrão).
**Otimizações possíveis:** nenhuma identificada.

---

## `campaigns`

**Origem:** `architecture/domain.md`; RFC-002.
**Responsabilidade:** traduzir a intenção da Estratégia em uma aposta concreta.
**Relacionamentos:** pertence a uma `strategy`; pai de `tactics`.

| Coluna | Tipo | Constraint |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | not null, FK → `workspaces.id`, `on delete cascade` |
| `strategy_id` | uuid | not null, FK → `strategies.id`, `on delete restrict` |
| `name` | text | not null |
| `description` | text | nullable |
| `origin` | enum `campaign_origin` (`handoff`, `manual`) | not null — 🔒 RFC-002: "uma Campanha pode nascer de duas formas" |
| `created_by` | uuid | nullable, FK → `members.id` — ✅ ADR-011 (Membro); exige apenas Membro `ativo`, qualquer `role` (ADR-012) |
| `created_at` | timestamptz | not null default now() |

**Sem coluna de status — decisão de modelagem, não lacuna silenciada:** RFC-004 (fonte transversal e mais recente sobre estados) define que Campanha tem "apenas 'Ativa' — existência simples" e registra "lacuna plena" para qualquer estado adicional (Bloqueador 2, ainda não resolvido). A linguagem de RFC-001/RFC-002 sobre uma "proposta revisável antes de virar real" é interpretada aqui como um estágio **anterior à persistência** (rascunho em memória/sessão, nunca gravado nesta tabela) — apenas `actions` tem um estado "Proposta" persistido, porque é a única das três entidades para a qual RFC-004 documenta essa fase explicitamente. Ver `migrations-strategy.md` para como uma futura coluna de status seria adicionada sem quebra, quando o Bloqueador 2 for resolvido em Review.

**Regras de integridade:** ADR-008 — só pode ser criada com `strategy_id` apontando para uma Estratégia com `status = 'ativa'` (regra de aplicação, não CHECK — depende de outra tabela).
**Constraints:** `on delete restrict` na FK de `strategy_id` — uma Estratégia com Campanhas nunca deve ser excluída fisicamente (ADR-004 trata "encerrada" como estado, nunca como remoção).
**Índices:** `strategy_id`; `workspace_id` (padrão).
**Otimizações possíveis:** índice composto `(strategy_id, created_at)` se a listagem de Campanhas por Estratégia precisar de ordenação cronológica frequente — adicionar quando o padrão de consulta real do frontend existir.

---

## `tactics`

**Origem:** `architecture/domain.md`; RFC-002.
**Responsabilidade:** definir a abordagem ("como") dentro de uma Campanha.
**Relacionamentos:** pertence a uma `campaign`; pai de `actions`; pode ser o "lar" polimórfico de um `experiment`.

| Coluna | Tipo | Constraint |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | not null, FK → `workspaces.id`, `on delete cascade` |
| `campaign_id` | uuid | not null, FK → `campaigns.id`, `on delete restrict` |
| `name` | text | not null |
| `description` | text | nullable |
| `created_by` | uuid | nullable, FK → `members.id` — ✅ ADR-011 (Membro); exige apenas Membro `ativo`, qualquer `role` (ADR-012) |
| `created_at` | timestamptz | not null default now() |

**Sem coluna de status** — mesma justificativa de `campaigns` (Bloqueador 2).

**Regras de integridade:** mesma regra hierárquica — Tática não existe sem Campanha, que não existe sem Estratégia ativa (`domain.md`, "Fluxo de criação").
**Constraints:** `on delete restrict` em `campaign_id`.
**Índices:** `campaign_id`; `workspace_id`.
**Otimizações possíveis:** mesma consideração de índice composto de `campaigns`, se necessário.

---

## `actions`

**Origem:** `architecture/domain.md`; RFC-002; RFC-004 (máquina de estados).
**Responsabilidade:** unidade executável — o que de fato é feito, agendado ou publicado.
**Relacionamentos:** pertence a uma `tactic`; pode ser o "lar" polimórfico de um `experiment`; produz `evidences`.

| Coluna | Tipo | Constraint |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | not null, FK → `workspaces.id`, `on delete cascade` |
| `tactic_id` | uuid | not null, FK → `tactics.id`, `on delete restrict` |
| `name` | text | not null |
| `description` | text | nullable |
| `status` | enum `action_status` (`proposta`, `aprovada`, `em_execucao`, `concluida`, `publicada`) | not null default `proposta` — 🔒 RFC-004 |
| `approved_by` | uuid | nullable, FK → `members.id` — ✅ ADR-011 (Membro); ADR-012 exige apenas Membro `ativo`, qualquer `role` (diferente de `strategy_steps.approved_by` e `experiments.approved_by`, que exigem especificamente `role = 'admin'`) |
| `approved_at` | timestamptz | nullable |
| `completed_at` | timestamptz | nullable |
| `created_at` | timestamptz | not null default now() |
| `updated_at` | timestamptz | nullable |

**Regras de integridade:**
- RFC-004: transições permitidas `proposta → aprovada → em_execucao → (concluida | publicada)`; qualquer outra transição é proibida por inferência (RFC-004, "Ação", "Transições proibidas") — regra de aplicação, não CHECK (Postgres não valida transição de estado sem trigger; ver `physical-model.md` para uma opção de trigger como *hardening* opcional).
- ADR-004: nenhuma Ação nasce (`INSERT`) numa Tática cuja Campanha pertence a uma Estratégia encerrada.

**Constraints:** `on delete restrict` em `tactic_id`.
**Índices:** `tactic_id`; `workspace_id`; índice em `status` (consultas de "Ações pendentes de aprovação/execução" — RFC-002, Rotina de execução).
**Otimizações possíveis:** índice parcial `(tactic_id) where status in ('proposta', 'aprovada', 'em_execucao')` para acelerar a tela de rotina de execução, que provavelmente filtra por Ações ainda não concluídas.

---

## `evidences`

**Origem:** `architecture/domain.md`; RFC-002 (produção); RFC-003 (consumo).
**Responsabilidade:** registro bruto e imutável do que aconteceu, vindo de uma Ação ou de um Experimento.
**Relacionamentos:** posse polimórfica — pertence a exatamente uma `action` **ou** a exatamente um `experiment`; origina `hypotheses` e `learnings`.

| Coluna | Tipo | Constraint |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | not null, FK → `workspaces.id`, `on delete cascade` |
| `action_id` | uuid | nullable, FK → `actions.id`, `on delete cascade` |
| `experiment_id` | uuid | nullable, FK → `experiments.id`, `on delete cascade` — **constraint adicionada após a criação de `experiments`**, ver `migrations-strategy.md` |
| `content` | jsonb | not null |
| `created_at` | timestamptz | not null default now() |

Sem `updated_at` — tabela append-only (`domain.md`: "o registro bruto do que aconteceu"; RFC-005, crítério nº2: nada é descartado).

**Regras de integridade:** exatamente uma das duas origens deve estar preenchida — nunca as duas, nunca nenhuma.
**Constraints:** `check (num_nonnulls(action_id, experiment_id) = 1)`.
**Índices:** `action_id` (parcial, `where action_id is not null`); `experiment_id` (parcial, `where experiment_id is not null`); `workspace_id`.
**Otimizações possíveis:** os dois índices parciais acima já evitam o custo de indexar metade de cada coluna com `null` — essa é a otimização principal desta tabela, dado que ela cresce continuamente (é o dado de entrada do Growth Framework, `domain.md`, "Fluxo de aprendizagem").

---

## `hypotheses`

**Origem:** `architecture/domain.md`; RFC-003; RFC-004 (máquina de estados).
**Responsabilidade:** elo formal entre uma Evidência observada e a justificativa de um Experimento.
**Relacionamentos:** nasce de uma `evidence`; justifica um ou mais `experiments`.

| Coluna | Tipo | Constraint |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | not null, FK → `workspaces.id`, `on delete cascade` |
| `evidence_id` | uuid | not null, FK → `evidences.id`, `on delete restrict` |
| `description` | text | not null |
| `status` | enum `hypothesis_status` (`registrada`, `priorizada`, `em_teste`, `validada`, `refutada`) | not null default `registrada` — 🔒 RFC-004 |
| `created_by` | uuid | nullable, FK → `members.id` — ✅ ADR-011 (Membro); exige apenas Membro `ativo`, qualquer `role` (ADR-012); RFC-003 permite origem por IA ou manual — sugestão de IA sempre passa por confirmação humana antes de gravar (Regra Absoluta nº2, `IMPLEMENTATION_STANDARDS.md`) |
| `created_at` | timestamptz | not null default now() |
| `updated_at` | timestamptz | nullable |

**Regras de integridade:**
- RFC-003, Blueprint Cap. 6.3: "nunca de opinião" — toda Hipótese exige uma Evidência de origem, garantido pela FK `not null`.
- RFC-004: transições permitidas `registrada → priorizada → em_teste → (validada | refutada)`.

**Constraints:** `on delete restrict` em `evidence_id` (uma Evidência referenciada por uma Hipótese nunca deve ser excluída fisicamente).
**Índices:** `evidence_id`; `workspace_id`; índice em `status`.
**Otimizações possíveis:** índice parcial `(workspace_id) where status = 'priorizada'` para a tela de priorização entre Hipóteses concorrentes (RFC-003, "Participação da IA").

---

## `experiments`

**Origem:** `architecture/domain.md`; RFC-002 (execução); RFC-003 (origem); RFC-004 (máquina de estados).
**Responsabilidade:** teste estruturado, sempre justificado por uma Hipótese e servindo a um Objetivo da Estratégia ativa.
**Relacionamentos:** justificado por uma `hypothesis`; serve a um `strategy_objective`; posse polimórfica — roda dentro de exatamente uma `tactic` **ou** uma `action`; produz `evidences`.

| Coluna | Tipo | Constraint |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | not null, FK → `workspaces.id`, `on delete cascade` |
| `hypothesis_id` | uuid | not null, FK → `hypotheses.id`, `on delete restrict` |
| `objective_id` | uuid | not null, FK → `strategy_objectives.id`, `on delete restrict` — 🔒 RFC-003, critério nº2 |
| `tactic_id` | uuid | nullable, FK → `tactics.id`, `on delete restrict` |
| `action_id` | uuid | nullable, FK → `actions.id`, `on delete restrict` |
| `status` | enum `experiment_status` (`proposto`, `aprovado`, `em_execucao`, `concluido`) | not null default `proposto` — 🔒 RFC-004 |
| `approved_by` | uuid | nullable, FK → `members.id` — ✅ ADR-012: exige Membro com `role = 'admin'` — nunca IA (Regra Absoluta nº11, `IMPLEMENTATION_STANDARDS.md`). Coluna permanece nullable até a FK para `members.id` existir (depende apenas de `members` ter sido criada, Migration 1). |
| `approved_at` | timestamptz | nullable |
| `created_at` | timestamptz | not null default now() |
| `updated_at` | timestamptz | nullable |

**Regras de integridade:**
- RFC-003, critério nº2 / Blueprint Cap. 6.4: transição `proposto → aprovado` exige a "dupla amarração" (`hypothesis_id` e `objective_id` ambos preenchidos e válidos) — já garantido por serem `not null`; a *autoridade* que efetua essa transição é Membro com `role = 'admin'` (ADR-012).
- Exatamente uma das duas posses (`tactic_id`, `action_id`) preenchida.

**Constraints:** `check (num_nonnulls(tactic_id, action_id) = 1)`.
**Índices:** `hypothesis_id`; `objective_id`; `tactic_id` (parcial); `action_id` (parcial); `workspace_id`; índice em `status`.
**Otimizações possíveis:** índice parcial `(workspace_id) where status = 'proposto'` — fila de Experimentos aguardando aprovação de um Membro `admin` (ADR-012).

---

## `learnings`

**Origem:** `architecture/domain.md`; RFC-005.
**Responsabilidade:** conclusão acionável — o que a Evidência significa e o que fazer a respeito; alimenta a próxima Estratégia.
**Relacionamentos:** interpreta uma `evidence`; referenciado informacionalmente (não por FK de posse) pela próxima `strategy`.

| Coluna | Tipo | Constraint |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | not null, FK → `workspaces.id`, `on delete cascade` |
| `evidence_id` | uuid | not null, FK → `evidences.id`, `on delete restrict` |
| `content` | jsonb | not null — raciocínio + conclusão |
| `created_by` | uuid | nullable, FK → `members.id` — ✅ ADR-011 (Membro); exige apenas Membro `ativo`, qualquer `role` (ADR-012); RFC-005 descreve interpretação conjunta IA+humano |
| `created_at` | timestamptz | not null default now() |

Sem `updated_at` — append-only, mesma justificativa de `evidences` (RFC-005, crítério nº2: "nenhuma entrada de Aprendizado é descartada").

**Regras de integridade:** toda entrada carrega a Evidência que a originou (RFC-005, crítério nº1) — garantido por FK `not null`.
**Constraints:** `on delete restrict` em `evidence_id`.
**Índices:** `evidence_id`; `workspace_id`; `created_at` (consultas cronológicas de Biblioteca/Relatórios, RFC-006/RFC-007, que leem esta tabela por agregação, sem FK própria — ver `docs/implementation/backend/repositories.md`).
**Otimizações possíveis:** se o volume de Aprendizados por Workspace crescer muito ao longo de vários ciclos, considerar índice GIN em `content` para suportar a futura "consulta futura" que RFC-005 menciona sem detalhar mecanismo — não implementado agora por ausência de requisito confirmado (mesma lacuna que RFC-006 registra para Biblioteca).

---

## `integrations`

**Origem:** RFC-008 ("integrações" — sem tipos específicos documentados); Implementation Plan, Fase 9.
**Responsabilidade:** mecanismo genérico de armazenamento de configuração de integração externa.
**Relacionamentos:** pertence a um `workspace`.

| Coluna | Tipo | Constraint |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | not null, FK → `workspaces.id`, `on delete cascade` |
| `type` | text | not null — ⚠️ sem enum, porque nenhuma fonte nomeia um tipo específico (RFC-008, "Fora do escopo") |
| `configuration` | jsonb | not null |
| `created_by` | uuid | nullable, FK → `members.id` — ✅ ADR-011 (Membro); ADR-012 trata "alterar Integrações" como sensível e exige `role = 'admin'` |
| `created_at` | timestamptz | not null default now() |

**Regras de integridade:** nenhuma além do vínculo com Workspace — qualquer regra de validação por tipo de integração é, por definição de RFC-008, fora do escopo até uma RFC própria existir.
**Constraints:** nenhuma além da FK.
**Índices:** `workspace_id`.
**Otimizações possíveis:** nenhuma identificada — tabela de baixo volume esperado na v1.
