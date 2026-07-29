# ARCHITECTURE_RESOLUTION.md

**Status:** Congelado
**Data:** 2026-07-26
**Papel de origem:** Principal Technical Program Manager

Este documento transforma o [Backlog Técnico Consolidado](#) (produzido a partir de Product Review, RFC Review, Architecture Review, Database Review e Threat Modeling Review) em decisões oficiais de projeto. É a última etapa documental antes do início da implementação. Nenhuma funcionalidade nova foi proposta, nenhuma RFC foi reescrita, nenhum código ou SQL foi gerado — apenas decisões de fechamento.

---

## Grupo A — Bloqueadores obrigatórios antes da Fase 1

### A1 — Entidade Membro não ratificada
- **Situação:** ✅ Resolvido
- **Justificativa:** ADR-011 (`DECISIONS.md`) ratifica Membro como tabela de junção Workspace↔identidade (`id`, `workspace_id`, `user_id` nullable, `email`, `status`, `role`, `invited_by`, `invited_at`, `joined_at`, `created_at`), compatível com A3, A4 e A7 já aceitos.
- **Documento(s) alterados:** `DECISIONS.md` (ADR-011); RFC-008 (estrutura de Membro incorporada).
- **Responsável:** Produto.
- **Critério de encerramento:** ADR-011 aceito em `DECISIONS.md`. ✅ Cumprido.

### A2 — RBAC mínimo ausente
- **Situação:** ✅ Resolvido
- **Justificativa:** ADR-012 (`DECISIONS.md`) ratifica dois papéis (`admin`/`membro`) com mapeamento explícito de operação → autoridade mínima. Como efeito direto, resolve também o Bloqueador 3 (B2/B3 abaixo — "quem aprova um Experimento" = Membro `admin`).
- **Documento(s) alterados:** `DECISIONS.md` (ADR-012); RFC-008, RFC-003, RFC-004 (referenciam a decisão em vez de registrar a lacuna).
- **Responsável:** Produto.
- **Critério de encerramento:** ADR-012 aceito, com mapeamento de operação→papel. ✅ Cumprido.

### A3 — Fluxo de convite incompleto
- **Situação:** ✅ Resolvido
- **Justificativa:** `members.user_id not null` era incompatível com o valor `status = 'convidado'`. Correção adotada: `user_id` passa a ser nullable, com coluna `email` para o convite pendente, populando `user_id` somente na aceitação. É uma correção estrutural de engenharia, não uma nova funcionalidade — não depende de A1/A2 para ser aplicada ao schema, apenas para ser *habilitada em produção*.
- **Documento(s) a alterar:** `docs/database/logical-model.md`.
- **Responsável:** Banco.
- **Critério de encerramento:** `logical-model.md` atualizado sem contradição entre nulidade de `user_id` e o valor `convidado`.

### A4 — Revogação de acesso não é imediata
- **Situação:** ✅ Resolvido
- **Justificativa:** decisão arquitetural adotada — toda política de RLS e toda validação de serviço deve checar `members.status = 'ativo'` no momento da requisição, nunca confiar em claim de sessão cacheado. Não é uma decisão de produto; é uma regra de segurança que qualquer implementação de autorização precisa seguir por definição.
- **Documento(s) a alterar:** `docs/database/rls-policies.md`; `docs/implementation/backend/validation.md`.
- **Responsável:** Backend.
- **Critério de encerramento:** regra registrada explicitamente nos dois documentos.

### A5 — Criação de Workspace não especificada
- **Situação:** ✅ Resolvido
- **Justificativa:** ADR-013 (`DECISIONS.md`) define criação self-service: usuário autenticado cria o Workspace e se torna, na mesma transação, o primeiro Membro com `role = 'admin'` (ADR-012). Responsabilidade atribuída a um `WorkspaceService` transversal (Workspace não é módulo do Blueprint, não pertence a nenhuma das 7 RFCs de módulo).
- **Documento(s) alterados:** `DECISIONS.md` (ADR-013); `docs/database/rls-policies.md` (política de `workspaces.insert` a corrigir na próxima revisão desse documento).
- **Responsável:** Produto.
- **Critério de encerramento:** ADR-013 aceito, com fluxo de "primeiro acesso" descrito. ✅ Cumprido.

### A6 — FK sem consistência de tenant
- **Situação:** ✅ Resolvido
- **Justificativa:** decisão arquitetural adotada — toda FK entre tabelas passa a ser composta `(workspace_id, id)` em vez de FK simples, exigindo `unique (workspace_id, id)` nas tabelas-pai. Elimina o vetor de referência cruzada entre tenants identificado no Database Review e no Threat Modeling Review.
- **Documento(s) a alterar:** `docs/database/logical-model.md`; `docs/database/physical-model.md`.
- **Responsável:** Banco.
- **Critério de encerramento:** todas as FKs cross-tabela do modelo lógico documentadas como compostas.

### A7 — RLS recursiva em `members`
- **Situação:** ✅ Resolvido
- **Justificativa:** decisão arquitetural adotada — a política de `members` passa a resolver pertencimento a Workspace via uma function `security definer`, que ignora RLS internamente, eliminando a autorreferência que causava recursão.
- **Documento(s) a alterar:** `docs/database/rls-policies.md`.
- **Responsável:** Banco.
- **Critério de encerramento:** política de `members` reescrita no documento sem consulta recursiva direta à própria tabela.

### A8 — "Enable RLS" não é passo verificável
- **Situação:** ✅ Resolvido
- **Justificativa:** correção de processo — o checklist de implementação passa a exigir, como item próprio e verificável, a habilitação de RLS por tabela, distinta e anterior à criação de qualquer política.
- **Documento(s) a alterar:** `docs/database/README.md` (checklist); `docs/database/migrations-strategy.md`.
- **Responsável:** Banco.
- **Critério de encerramento:** item explícito "RLS habilitada e verificada por tabela" presente nos dois checklists.

### A9 — `service_role` anula defesa em profundidade
- **Situação:** ✅ Resolvido
- **Justificativa:** ADR-014 (`DECISIONS.md`) define o desenho formal: toda Server Action executa dentro de uma transação Postgres com role de sessão `authenticated` e `auth.uid()` propagado via variável de sessão (compatível com pooling em modo transação/Supavisor); `service_role` nunca é usado em caminho de usuário final, reservado exclusivamente a jobs em background e migrations. Corrige a contradição até então presente em `rls-policies.md`.
- **Documento(s) alterados:** `DECISIONS.md` (ADR-014). **Pendente de atualização de conteúdo (não é decisão em aberto, é aplicação editorial):** `docs/database/rls-policies.md` (seção "Papel da `service_role`"), `docs/implementation/backend/architecture.md` (hoje stub — deve incorporar o desenho quando escrito).
- **Responsável:** Arquitetura.
- **Critério de encerramento:** desenho formal registrado em ADR-014, com os casos excepcionais de `service_role` explicitamente listados. ✅ Cumprido.

### A10 — Contexto de Workspace deve vir sempre da sessão
- **Situação:** ✅ Resolvido
- **Justificativa:** decisão arquitetural adotada — nenhuma operação de escrita ou leitura pode aceitar `workspace_id`/identidade de Membro como parâmetro confiável vindo do cliente; ambos são sempre derivados de `auth.uid()` no servidor.
- **Documento(s) a alterar:** `docs/implementation/backend/validation.md`; `docs/implementation/api/contracts.md`.
- **Responsável:** Backend.
- **Critério de encerramento:** regra documentada explicitamente nos dois arquivos como pré-condição de todo contrato de API/Server Action.

### A11 — Cascata de exclusão sem destino definido
- **Situação:** ✅ Resolvido
- **Justificativa:** decisão arquitetural adotada — colunas `*_by` passam a usar `on delete set null` (preservam o registro, perdem a identidade do autor); a cascata de `auth.users` para `members` é revista para nunca excluir fisicamente a linha de `members` (o campo `status = 'removido'` já existe exatamente para isso).
- **Documento(s) a alterar:** `docs/database/logical-model.md`; `docs/database/physical-model.md`.
- **Responsável:** Banco.
- **Critério de encerramento:** modelo lógico atualizado refletindo `on delete set null` em toda coluna `*_by` e a remoção do `on delete cascade` direto de `auth.users` para `members`.

### A12 — Ambiguidade sobre quando a Estratégia se torna "ativa"
- **Situação:** ✅ Resolvido
- **Justificativa:** ADR-015 (`DECISIONS.md`) confirma a leitura já proposta por RFC-001: `status='ativa'` desde o início da formulação, sem terceiro estado. Esclarece que "ativa" não implica handoff automático liberado — este depende, separadamente, da aprovação da síntese.
- **Documento(s) alterados:** `DECISIONS.md` (ADR-015); RFC-001 (ambiguidade removida de "Fluxos"); `docs/database/migrations-strategy.md` (ressalva da Migration 2 removida).
- **Responsável:** Produto.
- **Critério de encerramento:** ADR-015 aceito confirmando a leitura de RFC-001. ✅ Cumprido.

### A13 — LGPD (direito de exclusão) vs. "Aprendizado nunca é descartado"
- **Situação:** 🚧 Aberto — decisão de Produto pendente. (Não endereçado nesta rodada de decisão por definição de escopo — ver ADR-011 a ADR-015; isso não o torna "fora do escopo" do projeto, apenas desta rodada.)
- **Justificativa:** conflito entre um princípio de produto (RFC-004/005: Evidência e Aprendizado nunca são apagados) e uma obrigação legal (LGPD, Art. 18). A resolução técnica mais provável (anonimizar `*_by`, preservar conteúdo) depende de essa reconciliação ser aprovada como política antes de virar regra de schema.
- **Documento(s) a alterar:** novo ADR complementar a RFC-004 e RFC-005.
- **Responsável:** Produto (com apoio jurídico).
- **Critério de encerramento:** ADR aceito definindo o mecanismo de anonimização como resposta ao direito de exclusão, sem contradizer a imutabilidade de conteúdo de RFC-004/005.

**Resumo do Grupo A:** 12 de 13 itens resolvidos — A3, A4, A6, A7, A8, A10, A11 (rodada anterior) e A1, A2, A5, A9, A12 (esta rodada, via ADR-011 a ADR-015 em `DECISIONS.md`). **1 item permanece aberto: A13** (LGPD vs. imutabilidade de Evidência/Aprendizado — fora do escopo desta rodada, aguardando decisão de Produto com apoio jurídico).

---

## Grupo B — Devem ser resolvidos durante a implementação

| ID | Nome | Situação | Fase | Documento(s) a alterar | Responsável | Critério de encerramento |
|---|---|---|---|---|---|---|
| B1 | Estado de Campanha/Tática (Bloqueador 2) | Resolver durante implementação | Fase 3 | RFC-004 (via Review, não ADR de atalho) | Produto | Lacuna fechada em Review, referenciada por ADR próprio |
| B2 | Autoridade de aprovação de Experimento (Bloqueador 3) | ✅ Resolvido — ADR-012 | Fase 4 | RFC-003/RFC-004 (referenciam ADR-012) | Produto | Decisão registrada em ADR-012: aprovação exige Membro `admin`. ✅ Cumprido |
| B3 | `approved_by` enviesado para uma opção do Bloqueador 3 | Resolver durante implementação — nota: a ambiguidade de *produto* que este item media (viés de opção) já não existe, pois ADR-012 define a autoridade por `role`, não por identidade específica; o que resta é puramente a tarefa de implementação (FK) | Fase 4 | `docs/database/logical-model.md` | Banco | FK `experiments.approved_by → members.id` a adicionar quando `members` for implementada (ADR-011) |
| B4 | Destino de entidades em andamento ao encerrar Estratégia | Resolver durante implementação | Fase 3/5 | RFC-002/RFC-004 (via Review) | Produto | Decisão registrada antes da lógica de encerramento ser codificada |
| B5 | Corrida em transições de estado | Resolver durante implementação | Fase 3/4 | `docs/implementation/backend/services.md` | Backend | Padrão de escrita condicional (`update ... where status = X`) documentado |
| B6 | Transação atômica de "Evoluir Estratégia" | Resolver durante implementação | Fase 5 | `docs/implementation/backend/services.md` | Backend | Transação única documentada para encerrar + criar |
| B7 | Idempotência de transições de estado | Resolver durante implementação | Fase 3/4 | `docs/implementation/backend/services.md`, `api/contracts.md` | Backend | Estratégia de idempotência definida para toda transição de estado |
| B8 | Trilha de auditoria de transições intermediárias | Resolver durante implementação | Transversal | `docs/implementation/backend/architecture.md` | Arquitetura | Mecanismo mínimo de histórico de transição definido antes da Fase 3 |
| B9 | Nenhuma tela/wireframe definida | Resolver durante implementação | Fase 7 | Iteração de UX (fora de qualquer RFC) | Frontend | Wireframes aprovados antes do início da Fase 7 |
| B10 | Lacunas de escopo Biblioteca/Relatórios | Resolver durante implementação | Fase 6 | RFC-006/RFC-007 (via Review) | Produto | Lacunas fechadas em Review antes do início da Fase 6 |
| B11 | Sem separação sugestão-IA vs. mutação de estado | Resolver durante implementação | Fase 8 | `docs/implementation/ai/prompts.md` | Arquitetura | Regra documentada: IA nunca tem tool/function-call vinculada a mutação |
| B12 | Retenção/uso de dado pelos provedores de IA (DPA) | Resolver durante implementação | Fase 8 | `docs/implementation/ai/providers.md` | Produto | Configuração de provider (opt-out de treinamento) decidida e registrada |
| B13 | Rate limit/quota para chamadas de IA | Resolver durante implementação | Fase 8 | `docs/implementation/ai/providers.md`, `deployment/monitoring.md` | Backend | Quota por Workspace definida antes de produção |
| B14 | Criptografia de configuração de integrações | Resolver durante implementação | Fase 9 | `docs/database/logical-model.md` | Banco | Mecanismo de criptografia de coluna definido antes da Fase 9 |
| B15 | ERD com relação inexistente no modelo lógico | Resolver durante implementação | Fase 1 | `docs/database/README.md` | Arquitetura | ERD corrigido para refletir apenas relações com FK real |
| B16 | Reconsiderar persistência da proposta de handoff | Adiar | Fase 2/3 | RFC-001/RFC-002 (nota, não reescrita) | Arquitetura | Revisitar após primeira implementação real do fluxo de handoff |
| B17 | Índices/otimização de RLS (`members`, `select auth.uid()`) | Resolver durante implementação | Fase 1+ | `docs/database/logical-model.md`, `physical-model.md` | Banco | Índice composto e padrão de subselect documentados |
| B18 | Rate limit geral (fora de IA) | Resolver durante implementação | Fase 1+ | `docs/implementation/deployment/monitoring.md` | Backend | Política mínima de rate limit definida antes de produção |

---

## Grupo C — Confirmação (v1.1)

| ID | Nome | Decisão |
|---|---|---|
| C1 | RFC-001 Status/Checklist não padronizados | Permanece no backlog |
| C2 | OAuth/revogação/escopo mínimo de integrações | Permanece no roadmap (ligado à RFC futura de Fase 9) |
| C3 | Retenção indefinida vs. limitação do LGPD | Permanece no backlog |
| C4 | Região de hospedagem de dado não documentada | Permanece no backlog |
| C5 | Política de sessão/MFA não documentada | Permanece no backlog |
| C6 | `members.role` placeholder sem uso | Fundir com A2 (RBAC) |
| C7 | Ajustes cosméticos do modelo lógico | Permanece no backlog |
| C8 | Notas de vigilância da documentação de engenharia | Permanece no backlog |
| C9 | Sumarização de contexto de IA para histórico crescente | Permanece no roadmap |
| C10 | UUID não substitui autorização (reforço) | Remover — observação já incorporada, não é pendência acionável |

## Grupo D — Confirmação (v2+)

| ID | Nome | Decisão |
|---|---|---|
| D1 | Fronteira de agregação cross-Workspace da IA (Marketing Intelligence) | Permanece no roadmap |
| D2 | Enums nativos rígidos / ausência de particionamento | Permanece no roadmap |
| D3 | Isolamento de recursos por tenant em banco compartilhado | Permanece no roadmap |
| D4 | Upload de arquivos — nenhuma funcionalidade definida | Permanece no roadmap |
| D5 | Documento de performance/benchmark de teste para v2 | Permanece no roadmap |

---

## Tabela final

| ID | Status | Responsável | Documento | Fase |
|---|---|---|---|---|
| A1 | ✅ Resolvido — ADR-011 | Produto | `DECISIONS.md` | Fase 0/1 |
| A2 | ✅ Resolvido — ADR-012 | Produto | `DECISIONS.md`; RFC-008 | Fase 0/1 |
| A3 | ✅ Resolvido | Banco | `docs/database/logical-model.md` | Fase 1 |
| A4 | ✅ Resolvido | Backend | `docs/database/rls-policies.md`, `backend/validation.md` | Fase 1 |
| A5 | ✅ Resolvido — ADR-013 | Produto | `DECISIONS.md` | Fase 0/1 |
| A6 | ✅ Resolvido | Banco | `docs/database/logical-model.md`, `physical-model.md` | Fase 1 |
| A7 | ✅ Resolvido | Banco | `docs/database/rls-policies.md` | Fase 1 |
| A8 | ✅ Resolvido | Banco | `docs/database/README.md`, `migrations-strategy.md` | Fase 1 |
| A9 | ✅ Resolvido — ADR-014 | Arquitetura | `DECISIONS.md`; `docs/database/rls-policies.md` (correção editorial pendente) | Fase 1 |
| A10 | ✅ Resolvido | Backend | `backend/validation.md`, `api/contracts.md` | Fase 1 |
| A11 | ✅ Resolvido | Banco | `docs/database/logical-model.md`, `physical-model.md` | Fase 1 |
| A12 | ✅ Resolvido — ADR-015 | Produto | `DECISIONS.md`; RFC-001 | Fase 1 |
| A13 | 🚧 Aberto (não endereçado nesta rodada de decisão) | Produto | ADR referenciando RFC-004/005 | Fase 1 |
| B1 | Resolver durante implementação | Produto | RFC-004 (Review) | Fase 3 |
| B2 | ✅ Resolvido — ADR-012 | Produto | `DECISIONS.md` | Fase 4 |
| B3 | Decisão tomada (ADR-012); FK a adicionar quando `members` existir | Banco | `logical-model.md` | Fase 4 |
| B4 | Resolver durante implementação | Produto | RFC-002/004 (Review) | Fase 3/5 |
| B5 | Resolver durante implementação | Backend | `backend/services.md` | Fase 3/4 |
| B6 | Resolver durante implementação | Backend | `backend/services.md` | Fase 5 |
| B7 | Resolver durante implementação | Backend | `backend/services.md`, `api/contracts.md` | Fase 3/4 |
| B8 | Resolver durante implementação | Arquitetura | `backend/architecture.md` | Transversal |
| B9 | Resolver durante implementação | Frontend | Iteração de UX | Fase 7 |
| B10 | Resolver durante implementação | Produto | RFC-006/007 (Review) | Fase 6 |
| B11 | Resolver durante implementação | Arquitetura | `ai/prompts.md` | Fase 8 |
| B12 | Resolver durante implementação | Produto | `ai/providers.md` | Fase 8 |
| B13 | Resolver durante implementação | Backend | `ai/providers.md`, `monitoring.md` | Fase 8 |
| B14 | Resolver durante implementação | Banco | `logical-model.md` | Fase 9 |
| B15 | Resolver durante implementação | Arquitetura | `docs/database/README.md` | Fase 1 |
| B16 | Adiar | Arquitetura | RFC-001/002 (nota) | Fase 2/3 |
| B17 | Resolver durante implementação | Banco | `logical-model.md`, `physical-model.md` | Fase 1+ |
| B18 | Resolver durante implementação | Backend | `deployment/monitoring.md` | Fase 1+ |
| C1–C9 | Permanece no backlog/roadmap | Diversos | Diversos | v1.1 / v2 |
| C6 | Fundido com A2 | Produto | — | — |
| C10 | Removido | — | — | — |
| D1–D5 | Permanece no roadmap | Diversos | Diversos | v2 |

---

## Documentos que precisam ser atualizados

| Documento | Motivo | Itens relacionados |
|---|---|---|
| `DECISIONS.md` | ✅ ADR-011 (Membro), ADR-012 (RBAC), ADR-013 (criação de Workspace), ADR-014 (contexto autenticado), ADR-015 (Estratégia ativa) registrados. Pendente: ADR de LGPD/retenção | A1, A2, A5, A9, A12 ✅ · A13 pendente |
| `docs/database/logical-model.md` | Correções de schema: convite, FK composta, `on delete set null`, `approved_by`, criptografia | A3, A6, A11, B3, B14, B17 |
| `docs/database/physical-model.md` | FK composta, política de `on delete`, índices | A6, A11, B17 |
| `docs/database/rls-policies.md` | Correção de recursão, revogação em tempo real; **pendente:** substituir a seção "Papel da `service_role`" pelo desenho de ADR-014 (backend nunca usa `service_role` em caminho de usuário final); incorporar estrutura de `members`/`role` (ADR-011/012) e política de `workspaces.insert` self-service (ADR-013) | A4, A7, A9 ✅ (decisão), edição de conteúdo pendente |
| `docs/database/README.md` | Checklist com passo explícito de "enable RLS"; correção do ERD | A8, B15 |
| `docs/database/migrations-strategy.md` | Checklist alinhado à correção de RLS; sequenciamento após B1/B2 | A8, B1, B2 |
| `docs/implementation/backend/architecture.md` | ✅ Desenho formal de contexto de usuário autenticado vs. `service_role` decidido (ADR-014) — documento ainda é stub e deve incorporar o conteúdo do ADR; trilha de auditoria (B8) permanece pendente | A9 ✅ (decisão), B8 pendente |
| `docs/implementation/backend/validation.md` | Regra de revogação em tempo real; regra de contexto sempre da sessão | A4, A10 |
| `docs/implementation/backend/services.md` | Padrão de escrita condicional (corrida), transação atômica, idempotência | B5, B6, B7 |
| `docs/implementation/api/contracts.md` | Regra de não confiar em `workspace_id` do cliente; idempotência | A10, B7 |
| `docs/implementation/ai/context-builder.md` | ✅ Decisão de contexto de usuário vs. `service_role` já existe (ADR-014); documento a atualizar quando escrito | A9 ✅ |
| `docs/implementation/ai/prompts.md` | Regra de que IA nunca tem tool vinculada a mutação de estado | B11 |
| `docs/implementation/ai/providers.md` | Configuração de retenção/DPA; quota de uso | B12, B13 |
| `docs/implementation/deployment/monitoring.md` | Rate limit geral e de IA | B13, B18 |
| RFC-001 | ✅ Emenda aplicada — confirmação do momento em que a Estratégia se torna ativa (ADR-015) | A12 ✅ |
| RFC-003, RFC-004 | ✅ Emenda aplicada — aprovação de Experimento exige Membro `admin` (ADR-012); Bloqueador 3 fechado | B2 ✅ |
| RFC-002 (via Review, não reescrita) | Fechamento do Bloqueador 2 (estado de Campanha/Tática) e da lacuna de entidades em andamento | B1, B4 — permanecem abertos, fora do escopo desta rodada |
| RFC-004, RFC-005 (via ADR complementar, não reescrita) | Reconciliação LGPD vs. imutabilidade de registro | A13 — fora do escopo desta rodada |
| RFC-006, RFC-007 (via Review, não reescrita) | Fechamento das lacunas de escopo/leitura/métricas | B10 — permanece aberto |
| RFC-008 | ✅ Emenda aplicada — estrutura de Membro e RBAC incorporada (ADR-011, ADR-012, ADR-013) | A2, C6 ✅ |

---

## Checklist de prontidão para implementação

| Item | Status | Nota |
|---|---|---|
| ☑ Produto fechado | **Quase** | Apenas A13 (LGPD) permanece aberto, fora do escopo desta rodada; A1, A2, A5, A12 resolvidos via ADR-011/012/013/015 |
| ☐ RFCs fechadas | **Não** | Todas as oito RFCs permanecem em Draft/Proposta quanto ao seu ciclo de aprovação formal; RFC-001, RFC-003, RFC-004 e RFC-008 já incorporam as decisões desta rodada como emenda |
| ☑ Arquitetura fechada | **Sim** | A9 resolvido via ADR-014 |
| ☐ Banco fechado | **Parcial** | Correções de A3/A6/A7/A8/A10/A11 já registradas; a estrutura de `members` (ADR-011) e as FKs de `*_by` (ADR-011/012) ainda precisam ser incorporadas a `logical-model.md`/`physical-model.md`/`schema.ts` como trabalho de implementação, não como decisão em aberto |
| ☑ Segurança validada (nível de decisão) | **Sim** | A2 (RBAC) e A9 (contexto de execução) resolvidos por ADR; validação de implementação (testes de RLS com negação cruzada, Regra Absoluta nº7) permanece pendente até o código existir |
| ☑ Grupo A encerrado | **Quase — 12 de 13** | Apenas A13 permanece aberto, fora do escopo desta rodada (decisão de Produto com apoio jurídico) |
| ☑ Grupo B planejado | **Sim** | 18 itens com fase e responsável atribuídos; B2 resolvido nesta rodada (ADR-012) |
| ☑ Grupo C registrado | **Sim** | 10 itens confirmados (8 mantidos, 1 fundido, 1 removido) |
| ☑ Grupo D registrado | **Sim** | 5 itens confirmados para o roadmap v2+ |
| ☑ Pronto para iniciar camada Service | **Sim, com uma exceção nomeada** | A1, A2, A5, A9, A12 resolvidos. A13 (LGPD) não bloqueia a camada Service em si — afeta apenas o mecanismo de exclusão/anonimização de dado pessoal, que é uma capacidade adicional, não uma pré-condição para os métodos já mapeados no plano de Services. `schema.ts` e os repositories já implementados permanecem válidos; precisam apenas incorporar a tabela `members` e as FKs de `*_by` como próximo passo de implementação (não uma decisão pendente). |

**Conclusão:** esta rodada fecha os 5 bloqueadores de Produto/Arquitetura que impediam a camada Service (A1, A2, A5, A9, A12), via ADR-011 a ADR-015 em `DECISIONS.md`. O único item do Grupo A que permanece aberto é A13 (LGPD vs. imutabilidade de Evidência/Aprendizado), deliberadamente fora do escopo desta rodada — não bloqueia a implementação da camada Service, apenas a futura capacidade de exclusão/anonimização de dado pessoal. A partir desta decisão, a VEKTOR está pronta para implementar a camada Service sem stubs de autorização nem TODOs de identidade — restando apenas o trabalho de implementação (não de decisão) de adicionar `members` ao schema e conectar as FKs de `*_by` já previstas.
