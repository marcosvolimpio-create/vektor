# Políticas de Row Level Security

> Parte do [Modelo de Dados VEKTOR](./README.md). Descreve o desenho das políticas — não contém SQL executável, conforme escopo desta modelagem.

## Princípio único

Toda tabela do modelo (exceto `workspaces`, que tem regra própria) é isolada por `workspace_id`, comparado contra o conjunto de Workspaces aos quais o usuário autenticado (`auth.uid()`) pertence, via `members`. Esta é a materialização técnica de `architecture/domain.md` ("Workspace: o limite de tenant") e da mesma inferência de isolamento já usada por RFC-005 e RFC-006 para Aprendizado e Biblioteca ("nunca cruzando o limite de um Workspace para outro").

✅ **Membro está ratificado (ADR-011, `DECISIONS.md`)** — a tabela `members` tem estrutura formalmente aceita (`id`, `workspace_id`, `user_id` nullable, `email`, `status`, `role`, `invited_by`, `invited_at`, `joined_at`, `created_at`), o que dá às políticas abaixo um sujeito de autenticação real. O desenho abaixo usa exatamente essa estrutura. Pendência remanescente: gerar a migration física de `members` (trabalho de implementação, não de decisão — ver `migrations-strategy.md`, Migration 1).

## Condição-base reutilizada

Referida abaixo como **[isolamento]**: o `workspace_id` da linha precisa estar entre os Workspaces onde existe uma linha em `members` com `user_id = auth.uid()` e `status = 'ativo'`.

## Tabela de políticas

| Tabela | Operação | Regra (leitura/escrita) | Observação |
|---|---|---|---|
| `workspaces` | select/insert | usuário só vê Workspaces onde é `member` ativo; `insert` liberado a qualquer usuário autenticado (ADR-013 — criação self-service) | sem `update`/`delete` documentado — nenhuma fonte descreve edição ou remoção de Workspace após criado |
| `members` | select/insert/update | [isolamento] — vê os demais membros do(s) mesmo(s) Workspace(s) | `insert` (convite) e `update` (mudança de `status`/`role`) exigem `role = 'admin'` do Membro solicitante (ADR-012) — checagem de negócio feita na camada Service (`backend/validation.md`), não pela política de RLS, que garante apenas isolamento de tenant (ver "Por que RLS não substitui `backend/validation.md`" abaixo); sem `delete` — remoção é sempre `status = 'removido'` (Regra Absoluta nº8, `IMPLEMENTATION_STANDARDS.md`) |
| `strategies` | select/insert/update | [isolamento] | `insert`: sem regra adicional de RLS para ADR-003 (uma ativa por vez) — isso é reforçado pelo índice único parcial de `logical-model.md`, não pela política de RLS |
| `strategy_steps` | select/insert/update | [isolamento] | — |
| `strategy_objectives` | select/insert/update | [isolamento] | — |
| `campaigns` | select/insert | [isolamento] | sem `update`/`delete` documentado — nenhuma fonte descreve edição ou remoção de Campanha após criada |
| `tactics` | select/insert | [isolamento] | idem |
| `actions` | select/insert/update | [isolamento] | `update` necessário para as transições de `status` (RFC-004) |
| `evidences` | select/insert | [isolamento] | sem `update`/`delete` — tabela append-only por design (ver `logical-model.md`) |
| `hypotheses` | select/insert/update | [isolamento] | `update` necessário para transição de `status` |
| `experiments` | select/insert/update | [isolamento] | `update` necessário para transição de `status`; **a política não decide quem pode setar `approved_by`** — isso é regra de aplicação (Membro com `role = 'admin'`, ADR-012), verificada na camada Service, não pela política de isolamento de tenant |
| `learnings` | select/insert | [isolamento] | sem `update`/`delete` — append-only |
| `integrations` | select/insert/update/delete | [isolamento] | única tabela com `delete` documentável — remover uma integração é uma operação razoável e sem contraindicação em nenhuma fonte |
| `execution_recommendations` | select/insert/update | [isolamento] | Sprint 4 (Execução Inteligente) — entidade posterior a esta versão do documento, adicionada aqui na implementação (Sprint 5). Mesmo padrão de `actions`/`hypotheses`/`experiments`: `update` necessário para a transição de status (Pendente → Aceita/Executada/Descartada). Sem `delete` — `ExecutionRecommendationsRepository` não expõe esse método. |

## Implementação (Sprint 5)

**Status: Implementado.** `packages/db/migrations/0005_enable_rls_policies.sql` habilita RLS e cria as políticas acima para as 13 tabelas, usando uma função `security definer` (`public.is_workspace_member`) para resolver a condição **[isolamento]** sem a recursão que motivou A7 (`ARCHITECTURE_RESOLUTION.md`). Toda política é escopada `to authenticated`, consistente com ADR-014 (toda Server Action executa com `role = authenticated`).

**Caso de contorno tratado explicitamente — fundação self-service de Workspace (ADR-013):** no instante em que um usuário cria seu primeiro Workspace, ele ainda não é `member` dele — a política `members_insert` libera essa única inserção quando `user_id = auth.uid()` **e** nenhum Membro ainda existe para aquele `workspace_id` (bootstrap), além do caminho normal de convite (`is_workspace_member(workspace_id)`, para um admin já ativo convidando outra pessoa).

## Por que RLS não substitui `backend/validation.md`

RLS garante **isolamento entre Workspaces** — nunca garante um invariante de **produto** (ex.: ADR-004, "Estratégia encerrada nunca recebe nova Execução", ou a dupla amarração de Experimento). Essas regras dependem do conteúdo de outras linhas/tabelas e de lógica de negócio explícita, não apenas de "a quem esta linha pertence" — permanecem responsabilidade de `docs/implementation/backend/validation.md`. RLS é a camada de segurança; validação de domínio é a camada de correção de produto. As duas são complementares, nunca substitutas uma da outra — tratar RLS como suficiente para os ADRs de negócio é o risco arquitetural já registrado no Implementation Plan (ADR-004 sobre entidades em andamento).

## Papel da `service_role`

**Definido por ADR-014 (`DECISIONS.md`).** Toda Server Action/Route Handler, a partir da primeira consulta, executa dentro de uma transação Postgres que define a role de sessão como `authenticated` e popula a variável de sessão equivalente a `auth.uid()` com o id do usuário resolvido no servidor via Supabase Auth — inclusive para a consulta inicial de quais Workspaces o usuário pertence, usando a função `security definer` de A7 (ver "Recursão em `members`" acima). Isso significa que as políticas de RLS acima **se aplicam de fato a todo o tráfego de usuário final**, não apenas a um hipotético acesso direto de cliente — RLS deixa de ser só uma segunda camada de defesa teórica e passa a ser executada em toda requisição.

**`service_role` nunca é usado em caminho de usuário final.** Fica reservado exclusivamente a jobs em background e migrations, sem sessão de usuário associada — os únicos casos administrativos reais que a Regra Absoluta nº3 (`IMPLEMENTATION_STANDARDS.md`) permite. A responsabilidade primária de filtrar por Workspace continua em `backend/repositories.md`, que aplica o filtro explicitamente mesmo com RLS ativa (defesa em profundidade, Regra Absoluta nº7).
