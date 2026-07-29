# IMPLEMENTATION_STANDARDS.md

**Status:** Congelado
**Data:** 2026-07-26
**Papel de origem:** Principal Staff Engineer

Este documento é o contrato obrigatório para toda implementação futura da VEKTOR. Ele não implementa nada — define como qualquer código, migration ou schema futuro deve ser escrito para permanecer fiel a Product Canon, Product Blueprint, `DECISIONS.md`, RFC-001 a RFC-008, `architecture/*`, `docs/implementation/*`, `docs/database/*` e `ARCHITECTURE_RESOLUTION.md`. Nenhuma regra aqui reinterpreta esses documentos; toda regra aqui é a tradução direta de uma decisão já tomada neles.

Depois deste documento, o próximo artefato é o `schema.ts` do Drizzle.

---

# 1. Princípios Gerais

1. **Arquitetura primeiro.** Nenhuma linha de código é escrita antes de a decisão correspondente existir em um documento congelado (RFC, ADR ou `ARCHITECTURE_RESOLUTION.md`). Se a decisão não existe, o trabalho pára ali — não se resolve "no código".
2. **Não criar regras fora das RFCs.** Toda regra de negócio implementada é rastreável a uma RFC ou ADR específico. Se uma regra não tem essa origem, ela não é implementada.
3. **Não alterar comportamento de domínio.** Implementação nunca reinterpreta o que uma RFC diz. Onde uma RFC registra uma lacuna, o código não decide por conta própria — a lacuna é escalada, nunca preenchida silenciosamente.
4. **Não criar atalhos técnicos.** "Solução temporária" que contorna uma regra de arquitetura (usar `service_role` "só para simplificar", pular validação "para entregar mais rápido") reabre exatamente os riscos já fechados em `ARCHITECTURE_RESOLUTION.md`. Não é permitido em nenhuma circunstância, inclusive sob prazo.
5. **Todo código deve refletir os documentos oficiais.** Um Pull Request que implemente algo não rastreável a uma RFC, ADR, ou seção específica do modelo de dados é rejeitado até que essa rastreabilidade exista — na descrição do PR, não apenas na cabeça de quem escreveu.

---

# 2. Banco de Dados

- **Drizzle ORM.** Toda tabela é declarada via `pgTable`; todo enum via `pgEnum`. Nenhuma tabela existe fora do schema Drizzle. `docs/database/logical-model.md` é a especificação; `schema.ts` é a implementação — os dois devem corresponder 1:1, sempre.
- **Convenção de nomes.** Tabelas e colunas em `snake_case`, inglês, no plural para tabelas (`workspaces`, `strategies`, `campaigns`...). Cada tabela referencia, em comentário, sua entidade oficial correspondente em `architecture/domain.md`.
- **UUID.** Toda chave primária é `uuid`, gerada via `gen_random_uuid()`. Nunca `serial`/`bigint identity` — decisão de `physical-model.md`, motivada por anti-enumeração e compatibilidade com `auth.users`.
- **Timestamps.** `created_at timestamptz not null default now()` em toda tabela. `updated_at` apenas em tabelas mutáveis; tabelas append-only (`evidences`, `learnings`) nunca recebem `updated_at` — a ausência é uma decisão documentada, não um esquecimento.
- **Soft delete.** Único caso de soft delete no modelo é `members.status` (`convidado`/`ativo`/`removido`) — `members` nunca é excluída fisicamente (`ARCHITECTURE_RESOLUTION.md`, A11). Nenhuma outra tabela recebe uma coluna de exclusão lógica "por precaução"; Evidência e Aprendizado são imutáveis por princípio de produto (RFC-004/005), não "soft-deletáveis".
- **Enums.** `pgEnum` nativo apenas para conjuntos fechados por uma fonte (estados de RFC-004; as 11 etapas de RFC-001). Nunca criar um enum para um campo cujos valores não estão fechados em documento algum (ex.: `integrations.type` permanece `text`, porque RFC-008 não fecha os tipos).
- **FKs.** Toda referência entre tabelas usa FK composta `(workspace_id, id)`, nunca FK simples — decisão de `ARCHITECTURE_RESOLUTION.md`, A6. `on delete cascade` apenas do dono para o possuído; `restrict` em toda referência sem posse; `set null` em toda coluna `*_by` (A11).
- **Índices.** Todo índice tem uma consulta real documentada que o justifica — nenhum índice especulativo. Índice parcial onde a seletividade é alta (`status = 'ativa'`); índice composto onde RLS ou uma consulta de UI filtra por mais de uma coluna simultaneamente.
- **Migrations.** Sempre aditivas por padrão (*expand → migrate → contract* para mudanças destrutivas); geradas exclusivamente pelo Drizzle Kit, nunca escritas à mão. Toda migration referencia, no PR, a fase do Implementation Plan e a RFC/ADR de origem. RLS é habilitada e a política é criada na **mesma** migration que a tabela — nunca depois. A ordem de criação que resolve o ciclo `evidences ↔ experiments ↔ hypotheses` (`docs/database/migrations-strategy.md`) é seguida exatamente, nunca improvisada.
- **RLS.** Toda tabela tem `ENABLE ROW LEVEL SECURITY` como passo distinto e verificável, antes de qualquer política. A política de `members` nunca consulta `members` diretamente — usa uma function `security definer` (A7). Toda política usa `(select auth.uid())`, nunca `auth.uid()` solto.
- **Multi-tenancy.** `workspace_id` denormalizado em toda tabela. Nenhuma query de aplicação omite o filtro de Workspace mesmo com RLS ativa — RLS é defesa em profundidade, não a única camada.
- **Transações.** Toda operação com mais de uma escrita relacionada (ex.: Evoluir Estratégia = encerrar + criar) é uma transação única. Toda transição de estado usa escrita condicional (`update ... where status = X`) para evitar corrida.

---

# 3. Backend

- **Server Actions.** Padrão primário (CLAUDE.md). REST é reservado exatamente aos casos já identificados em `api/rest.md` (webhooks, integrações — Fase 9). **Toda** Server Action deriva Workspace/Membro da sessão autenticada no servidor — nunca de um parâmetro enviado pelo cliente (`ARCHITECTURE_RESOLUTION.md`, A10). Esta é a regra mais repetida em toda a cadeia de revisões desta arquitetura.
- **Services.** Um serviço por módulo de produto (Estratégia, Execução, Growth, Aprendizado, Biblioteca, Relatórios, Configurações). Nunca um serviço genérico que misture regras de módulos diferentes. Todo método de serviço é rastreável a um Critério de aceite específico de uma RFC.
- **Repositories.** Única camada com acesso direto ao Drizzle. Nenhum Server Action ou Service monta uma query diretamente — sempre passa por um repositório. Todo método de repositório recebe `workspace_id` explicitamente e o aplica no filtro, mesmo com RLS ativa.
- **Validações.** Zod na borda (`api/contracts.md`) valida forma; `backend/validation.md` valida regra de negócio (invariantes de ADR). As duas camadas são obrigatórias; nenhuma substitui a outra.
- **Tratamento de erro.** Toda violação de invariante mapeia a um erro nomeado em `api/errors.md`, referenciando o ADR/RFC de origem. Nunca uma exceção genérica sem essa rastreabilidade.
- **Autorização.** A estrutura de RBAC está ratificada (ADR-012, `DECISIONS.md`): dois papéis, `admin` e `membro`, com mapeamento explícito de operação → autoridade mínima. Nenhuma operação sensível (convidar/remover Membro, alterar Integrações, aprovar etapa/síntese de Estratégia, aprovar Experimento, disparar "Evoluir Estratégia") é implementada **sem incluir**, no mesmo trabalho, a checagem de `member.role === 'admin'` definida em ADR-012 — a checagem de `role` é parte obrigatória da implementação dessas operações, não um passo posterior opcional. Operações não listadas em ADR-012 (criar/aprovar Campanha, Tática, Ação; registrar Hipótese; propor Experimento; registrar Aprendizado) exigem apenas que o Membro esteja `ativo` no Workspace, qualquer `role`.
- **Autenticação.** Identidade sempre resolvida via Supabase Auth (`auth.uid()`) no servidor. Nenhuma implementação paralela de sessão.
- **Idempotência.** Toda transição de estado tem uma condição de idempotência — retry de rede ou duplo clique nunca duplica efeito colateral (Evidência, Aprendizado, etc.).
- **Concorrência.** Toda transição de estado usa escrita condicional. Nenhuma leitura-depois-escrita não atômica decide uma transição.
- **Logs.** Toda mutação de estado gera log estruturado incluindo `workspace_id` e Membro atuante. Nunca um log que misture dado de mais de um Workspace sem essa marcação explícita.

---

# 4. Frontend

- **App Router.** Estrutura de rotas espelha os dois Contextos de navegação (`architecture/navigation.md`) — Global e Estratégico — nunca uma estrutura que os misture.
- **Server Components.** Padrão default (CLAUDE.md, Code Quality).
- **Client Components.** Escopo mínimo — interação de UI apenas (formulários, seletores de contexto, dado que muda sem reload). Nenhuma lógica de negócio em Client Component; toda leitura/escrita passa por Server Action.
- **Formulários.** Usam exatamente o mesmo schema Zod de `api/contracts.md` usado no backend — nunca uma validação de formulário divergente da validação do servidor.
- **Loading.** Todo carregamento assíncrono tem estado de loading explícito (`loading.tsx`/Suspense do App Router). Nunca uma tela em branco sem feedback.
- **Error boundaries.** Um por módulo — erro em Growth nunca derruba a navegação de Estratégia. Nenhum error boundary genérico único para a aplicação inteira.
- **Optimistic UI.** Permitido apenas em ações reversíveis ou de baixo risco. Nunca em transições que exigem aprovação humana (ex.: aprovar Experimento) — a UI espera a confirmação real do servidor.
- **Cache.** TanStack Query para dado de servidor. Invalidação explícita e nomeada por mutação — nunca invalidação "de tudo" após qualquer ação.
- **Estado.** Zustand somente quando necessário (CLAUDE.md). Hoje, o único estado de cliente com justificativa documentada é Workspace ativo/Estratégia Ativa (`docs/implementation/frontend/state.md`) — nenhum outro estado global é criado sem a mesma justificativa por escrito.

---

# 5. IA

- **Prompts.** Um template por capacidade já listada em `architecture/ai.md`, tabela "Como a IA participa de cada módulo". Nenhuma capacidade fora dessa tabela é implementada sem RFC própria.
- **Context Builder.** Monta exatamente os quatro elementos definidos em `ai.md` (Workspace ativo, Estratégia ativa/Objetivos, posição no domínio, Evidência/Aprendizado acumulados). Toda query do Context Builder filtra `workspace_id` explicitamente no código — nunca depende de RLS sozinha.
- **Isolamento entre Workspaces.** Nenhuma sugestão de IA é gerada com contexto de mais de um Workspace simultaneamente. Testado explicitamente antes de qualquer módulo de IA ir a produção (ver Seção 7).
- **Ferramentas.** A IA nunca tem tool/function-call vinculada a um endpoint de mutação de estado (`ARCHITECTURE_RESOLUTION.md`, B11). Toda saída de IA é texto/proposta; a única forma de mudar o banco é um clique humano roteado por um Server Action que não distingue se a sugestão teve origem em IA.
- **Memória.** Exclusivamente Aprendizado/Biblioteca já persistidos e escopados por Workspace (`ai.md`, "Memória"). Nenhum armazenamento paralelo de conversa/contexto fora dessas fontes.
- **Limites.** As listas "Pode"/"Nunca" de `architecture/ai.md` são absolutas — a IA nunca aprova mudança estratégica, nunca dispara "Evoluir Estratégia", nunca decide sozinha o resultado de um Experimento. Nenhuma exceção por conveniência de implementação.
- **Aprovação humana.** Onde a fonte exige aprovação humana, ela é sempre um evento de UI distinto — nunca inferida a partir de uma resposta afirmativa da IA.
- **Auditoria.** Toda sugestão de IA aceita ou rejeitada por um humano é registrada (quem, quando, o que foi sugerido, o que foi decidido).

---

# 6. Segurança

- **Autenticação.** Supabase Auth é a única fonte de identidade. Nenhuma implementação paralela de sessão/token.
- **Autorização.** Nenhuma operação sensível sem checagem de nível de Membro (`members.role`, dois papéis — ADR-012). Revogação de acesso (`members.status`) é checada a cada requisição — nunca cacheada em claim de sessão (`ARCHITECTURE_RESOLUTION.md`, A4).
- **RLS.** Habilitada em toda tabela como passo explícito. Nenhuma tabela chega a produção sem RLS habilitada e testada.
- **IDs.** UUID em toda PK. Unicidade de ID nunca é tratada como controle de acesso — sempre acompanhada de checagem de autorização real.
- **Workspace.** Todo contexto de Workspace é derivado da sessão do servidor, nunca aceito do cliente. Regra mais citada em toda a cadeia de revisões (Database Review, Threat Modeling, `ARCHITECTURE_RESOLUTION.md` A10) — trate-a como absoluta.
- **`service_role`.** Reservado exclusivamente às tarefas administrativas explicitamente listadas em `docs/implementation/backend/architecture.md` (A9). Todo tráfego de usuário final opera no contexto de usuário autenticado, respeitando RLS.
- **Secrets.** Nenhuma chave (Supabase, Anthropic, OpenAI) em código-fonte ou versionada. Sempre variável de ambiente gerenciada pelo ambiente de deploy.
- **Variáveis de ambiente.** Uma fonte por ambiente (dev/staging/produção), nunca compartilhadas entre eles. Nenhuma chave de produção usada em desenvolvimento local.

---

# 7. Testes

- **Unitários.** Cobrem services/validation/repositories isolados. Todo invariante de ADR tem um teste unitário próprio (`docs/implementation/testing/unit.md`).
- **Integração.** Cobrem API + banco real dentro de um módulo. Toda constraint polimórfica (`evidences`, `experiments`) é testada explicitamente nos dois lados (com e sem a origem preenchida).
- **Banco.** Toda migration é testada localmente contra dado de exemplo antes de staging.
- **RLS.** Testado com múltiplos Workspaces simulados. Todo teste de RLS prova tanto o acesso permitido quanto a negação cruzada — tentar acessar dado de outro Workspace deve **falhar explicitamente** no teste, não apenas "não ter sido testado".
- **IA.** Teste de isolamento de contexto entre Workspaces é obrigatório antes de qualquer módulo de IA ir a produção. Teste de que nenhuma ferramenta de IA aciona mutação de estado diretamente.
- **E2E.** Ciclo completo Estratégia → Execução → Growth → Aprendizado → Evoluir Estratégia → nova Estratégia (`docs/implementation/testing/e2e.md`), incluindo isolamento multi-tenant.

---

# 8. Observabilidade

- **Logs.** Estruturados, incluindo `workspace_id` e Membro atuante em toda mutação. Nunca log que misture dado de Workspaces diferentes sem essa marcação.
- **Tracing.** Toda cadeia Server Action → Service → Repository → banco é rastreável por uma correlação única por requisição.
- **Métricas.** Técnicas (latência, taxa de erro, custo de IA por Workspace) vivem em `deployment/monitoring.md`. Métricas de produto (ex.: taxa de Hipótese Validada) vivem em Relatórios (RFC-007) — nunca as duas no mesmo lugar.
- **Auditoria.** Toda transição de estado sensível (aprovação, remoção, "Evoluir Estratégia") gera um registro de quem/quando/o quê, independente do dado de negócio em si.
- **Monitoramento.** Quota/rate limit de IA e de operações gerais monitorados por Workspace, com alerta **antes** do limite ser atingido — não apenas quando já foi excedido.

---

# 9. Definition of Done

Nenhuma funcionalidade é considerada concluída sem responder positivamente a todos os itens abaixo:

- ☐ **Produto atendido** — o comportamento implementado corresponde exatamente ao que o Blueprint/Canon descrevem, sem adição nem omissão.
- ☐ **RFC atendida** — todo Critério de aceite da RFC correspondente está implementado e testado; nenhum critério marcado "pendente de Review" foi tratado como resolvido.
- ☐ **Arquitetura respeitada** — a implementação segue exatamente as camadas e limites de módulo de `docs/implementation/backend/architecture.md` e `frontend/architecture.md`.
- ☐ **Banco consistente** — schema corresponde a `docs/database/logical-model.md`; nenhuma tabela/coluna existe no banco sem existir no modelo documentado, e vice-versa.
- ☐ **Testes aprovados** — cobertura conforme Seção 7, incluindo os testes negativos de RLS.
- ☐ **Segurança validada** — nenhuma das Regras Absolutas da Seção 10 foi violada; revisão de segurança (mesmo que leve) feita antes do merge.
- ☐ **Documentação atualizada** — qualquer documento de `docs/implementation/*` ou `docs/database/*` afetado pela mudança foi atualizado no mesmo PR, nunca depois.

---

# 10. Regras Absolutas

Estas regras nunca podem ser violadas, sob nenhuma justificativa de prazo, simplicidade ou conveniência:

1. Nunca confiar em `workspace_id` (ou qualquer identificador de Membro) enviado pelo cliente — sempre derivar da sessão autenticada no servidor.
2. Nunca executar mutação de estado diretamente pela IA — toda mutação exige um clique humano roteado por Server Action.
3. Nunca utilizar `service_role` para contornar autorização definida pela arquitetura — reservado às tarefas administrativas explicitamente listadas.
4. Nunca implementar comportamento não documentado nas RFCs — lacuna registrada se escala, nunca se resolve no código.
5. Nunca criar uma tabela sem `workspace_id`.
6. Nunca criar uma FK entre tabelas de domínio sem a variante composta `(workspace_id, id)`.
7. Nunca habilitar RLS sem testar explicitamente o acesso negado entre Workspaces.
8. Nunca excluir fisicamente uma linha de `members` — soft-delete via `status` é o único mecanismo permitido.
9. Nunca implementar uma ação que exige autorização diferenciada (convite/remoção de Membro, alteração de Integrações, aprovação de etapa/síntese de Estratégia, aprovação de Experimento, "Evoluir Estratégia") sem a checagem de `role = 'admin'` definida em ADR-012 (`DECISIONS.md`) — a estrutura de RBAC está ratificada; a ausência da checagem no código é a violação desta regra, não mais a ausência da estrutura.
10. Nunca reinterpretar ou "corrigir" uma RFC via comentário de código ou decisão de implementação — qualquer divergência percebida é escalada para Produto/Arquitetura, nunca decidida silenciosamente.
11. Nunca dar à IA uma ferramenta (function-calling) vinculada a um endpoint de mutação de estado.
12. Nunca versionar segredo ou chave de API em código-fonte.
13. Nunca aplicar uma migration destrutiva sem seguir *expand → migrate → contract*.
14. Nunca considerar uma funcionalidade "pronta" sem passar por todos os itens da Definition of Done (Seção 9).
15. Nunca tratar A13 (`ARCHITECTURE_RESOLUTION.md` — LGPD vs. imutabilidade de Evidência/Aprendizado) como resolvido só porque a implementação já começou — é o único item do Grupo A ainda aberto; módulos ou colunas que dependam de sua resolução (ex.: mecanismo de anonimização de Membro) não são construídos antes dela. Os demais cinco itens que antes bloqueavam a camada Service (A1, A2, A5, A9, A12) foram resolvidos via ADR-011 a ADR-015 e suas regras já estão refletidas nos itens acima desta seção — não permanecem como bloqueio.
