# Modelo Físico — PostgreSQL / Supabase / Drizzle ORM

> Parte do [Modelo de Dados VEKTOR](./README.md). Estas são decisões puramente técnicas (CLAUDE.md, Technology Stack) — nenhuma delas deriva de RFC ou ADR de produto, e nenhuma altera o modelo lógico já definido em [`logical-model.md`](./logical-model.md).

## Chave primária

`uuid`, gerado via `gen_random_uuid()` (extensão `pgcrypto`, habilitada por padrão em projetos Supabase). Preferido a `bigint identity` por dois motivos técnicos: (1) evita enumeração sequencial de registros entre Workspaces distintos, reforçando o isolamento de tenant já garantido por RLS; (2) é o padrão nativo do Supabase Auth para `auth.users.id`, com o qual `members.user_id` precisa combinar.

## Enums nativos do Postgres

Declarados como `CREATE TYPE ... AS ENUM` no banco, mapeados via `pgEnum` do Drizzle:

| Enum | Valores | Tabela(s) |
|---|---|---|
| `strategy_status` | `ativa`, `encerrada` | `strategies` |
| `strategy_step_type` | `diagnostico`, `mercado`, `concorrentes`, `swot`, `icp`, `personas`, `jornada_cliente`, `funis`, `objetivos`, `posicionamento`, `sintese` | `strategy_steps` |
| `campaign_origin` | `handoff`, `manual` | `campaigns` |
| `action_status` | `proposta`, `aprovada`, `em_execucao`, `concluida`, `publicada` | `actions` |
| `hypothesis_status` | `registrada`, `priorizada`, `em_teste`, `validada`, `refutada` | `hypotheses` |
| `experiment_status` | `proposto`, `aprovado`, `em_execucao`, `concluido` | `experiments` |
| `member_status` | `convidado`, `ativo`, `removido` | `members` |
| `member_role` | `admin`, `membro` | `members` — ✅ ADR-012 (`DECISIONS.md`) |

Enum nativo escolhido em vez de `text` com CHECK: o Postgres impede em tempo de escrita qualquer valor fora do conjunto, sem exigir uma constraint redigida à mão por tabela; o custo (alterar um enum exige `ALTER TYPE`, mais rígido que alterar um CHECK) é aceitável porque os valores de cada enum vêm diretamente de uma máquina de estados já fechada em RFC-004 — não são esperados para mudar com frequência.

**Nenhum enum foi criado para `origem` de `evidences`** (Ação vs. Experimento) — a informação já é derivável de qual das duas colunas polimórficas (`action_id`/`experiment_id`) está preenchida; um enum adicional seria um dado redundante, com risco real de dessincronizar da FK real.

## `jsonb` vs. colunas estruturadas

Usado em `strategy_steps.content`, `evidences.content`, `learnings.content`, `integrations.configuration` — nos quatro casos, o conteúdo é texto/estrutura livre que nenhuma fonte de produto especifica em campos fixos (RFC-001 não define os campos internos de um SWOT; RFC-002/003 não definem o formato de uma Evidência; RFC-008 não define o formato de uma configuração de integração). Normalizar esses campos em colunas hoje seria inventar uma estrutura de produto que nenhuma fonte autoriza — o `jsonb` mantém a porta aberta sem decidir por conta própria.

## Denormalização de `workspace_id`

Toda tabela carrega `workspace_id` diretamente, mesmo quando ele já é alcançável por join (ex.: `actions.workspace_id` é redundante com `actions.tactic_id → tactics.campaign_id → campaigns.strategy_id → strategies.workspace_id`). Isso é deliberado: cada política de RLS (ver [`rls-policies.md`](./rls-policies.md)) se torna uma comparação direta de coluna, sem exigir um join de até quatro níveis dentro do `USING` da política — recomendação padrão do próprio Supabase para RLS em hierarquias profundas, e mitigação direta do risco técnico "acoplamento não documentado" registrado no Implementation Plan.

Custo aceito: toda inserção precisa propagar o `workspace_id` correto manualmente (a camada de `backend/repositories.md` é responsável por isso, nunca o cliente) — mitigado por CHECK/trigger opcional descrito abaixo.

## Hardening opcional (não obrigatório para a v1)

Dois mecanismos de reforço que **não substituem** a validação de aplicação (`backend/validation.md`), mas podem ser adicionados como camada extra depois que o modelo estiver estável:

1. **Trigger de consistência de `workspace_id`:** antes de `INSERT`/`UPDATE` em tabelas filhas (`tactics`, `actions`, `evidences`, etc.), verificar que o `workspace_id` informado bate com o da entidade-pai referenciada. Evita o único jeito de a denormalização acima causar um bug real: inserir um `workspace_id` errado manualmente.
2. **Trigger de transição de estado:** para `actions.status`, `hypotheses.status`, `experiments.status`, validar que a transição respeita as regras de RFC-004 diretamente no banco, não só na aplicação. Não incluído como obrigatório porque duplicaria lógica que já precisa existir em `backend/validation.md` — considerar apenas se a aplicação mostrar sinais de bypass acidental da camada de serviço.

## `on delete`: `cascade` vs. `restrict`

Padrão aplicado de forma consistente em todo o modelo lógico:

- `cascade`: usado apenas do "dono" para o "possuído" (Workspace → tudo; Estratégia → suas etapas/objetivos; Ação/Experimento → a Evidência que produzem). Exclusão física do dono é rara na v1 (nenhuma fonte documenta exclusão de Workspace ou Estratégia — apenas encerramento), mas o `cascade` protege contra órfãos se um dia acontecer.
- `restrict`: usado em toda referência sem posse (Campanha → Estratégia; Hipótese → Evidência; Experimento → Hipótese/Objetivo/Tática/Ação; Aprendizado → Evidência). Uma exclusão que deixaria uma referência pendurada é bloqueada pelo banco, forçando uma decisão explícita na aplicação — nunca um apagamento silencioso em cascata de algo que RFC-004/RFC-005 tratam como registro permanente (Evidência, Aprendizado nunca são descartados).

## Schema Postgres único

Todas as tabelas vivem no schema `public` (padrão Supabase), exceto `auth.users`, gerenciado pelo próprio Supabase Auth e referenciado por `members.user_id` via FK cross-schema — suportado nativamente pelo Postgres.

## Compatibilidade com Drizzle ORM

- Todas as tabelas são declaráveis com `pgTable`, todos os enums com `pgEnum`, ambos já parte do dialeto `drizzle-orm/pg-core` (CLAUDE.md, ORM).
- Chaves estrangeiras cross-schema (`auth.users`) exigem declarar a tabela `auth.users` como uma referência externa no schema Drizzle (`pgSchema('auth').table('users', ...)`) apontando apenas para a coluna `id` — não para gerenciar migrations desse schema, que pertence ao Supabase.
- A constraint `check (num_nonnulls(...) = 1)` (usada em `evidences` e `experiments`) é expressa via `sql` template do Drizzle dentro do bloco de `check` da tabela — não há necessidade de SQL solto fora do schema Drizzle.
