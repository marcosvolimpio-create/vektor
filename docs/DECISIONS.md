# VEKTOR — Decisões Arquiteturais

Registro de decisões arquiteturais permanentes do produto. Complementa o [Product Canon](./product-canon.md) (princípios) e o [Product Blueprint](./product-blueprint.md) (especificação) com o "porquê" e o "quando" de escolhas estruturais específicas — para que a mesma discussão não precise ser reaberta a cada RFC.

## Objetivo do documento

Tornar rastreável toda decisão de arquitetura de produto que:

- restringe permanentemente uma escolha de design;
- resolve uma ambiguidade encontrada durante a especificação ou revisão;
- decide entre duas alternativas que uma RFC futura poderia querer reabrir sem ter o contexto original;
- introduz ou remove uma distinção terminológica importante.

Este documento não substitui o Canon nem o Blueprint — ele registra o histórico de escolhas feitas dentro do espaço que eles definem.

## Quando registrar uma decisão

- A decisão restringe permanentemente como um módulo, entidade ou fluxo se comporta.
- A decisão resolve uma inconsistência ou ambiguidade real (ex.: escopo de um módulo que aparecia descrito de duas formas diferentes).
- A decisão estabelece uma distinção terminológica que RFCs futuras precisam respeitar.
- A decisão é uma condição de contorno para o modelo de domínio, navegação ou IA.

## Quando NÃO registrar uma decisão

- Decisões de interface visual (cor, espaçamento, copy de botão) — isso é UX/design, não arquitetura de produto.
- Decisões de implementação técnica (framework, biblioteca, schema de banco) — pertencem à documentação técnica de arquitetura de software, não a este documento.
- Qualquer coisa já coberta sem ambiguidade pelo Product Canon ou pelo Product Blueprint — nesse caso, referencie o capítulo em vez de duplicar.
- Decisões reversíveis de baixo impacto que uma RFC pode tomar sozinha sem virar precedente para outras.

## Template para novas decisões

```markdown
## ADR-XXX — [Título da decisão]

**Data:** AAAA-MM-DD
**Status:** Proposta | Aceita | Substituída por ADR-YYY

### Contexto
O que motivou essa decisão precisar ser tomada.

### Decisão
A regra em si, de forma direta e verificável.

### Justificativa
Por que essa alternativa e não outra.

### Impacto
O que isso exige ou restringe em RFCs e implementações futuras.
```

---

## Decisões registradas

### ADR-001 — Dashboard não é um módulo

**Data:** 2026-07-26
**Status:** Aceita

**Contexto**
Ao definir a Arquitetura da Informação (Blueprint, Cap. 3.5), era preciso decidir se Dashboard seria uma tela com domínio próprio, igual às demais, ou algo distinto.

**Decisão**
Dashboard não é um módulo. É a visão composta do Contexto Global, sintetizando Estratégia + Execução + Growth + Aprendizado de todas as Estratégias do Workspace, para responder "o que merece minha atenção hoje".

**Justificativa**
Dashboard não possui entidade de domínio própria (Blueprint, Cap. 3.3) — ele lê dado de outros módulos, não produz dado novo. Tratá-lo como módulo forçaria a arquitetura a inventar um domínio artificial só para justificar uma tela.

**Impacto**
Nenhuma RFC deve propor "funcionalidades do módulo Dashboard" como se fosse um domínio isolado. Mudanças em Dashboard são sempre mudanças em como se sintetiza dado de outros módulos.

---

### ADR-002 — Evoluir Estratégia é uma ação, não um módulo

**Data:** 2026-07-26
**Status:** Aceita

**Contexto**
A navegação (Blueprint, Cap. 3.6) precisava decidir se "Evoluir Estratégia" seria um destino de navegação permanente ou uma transição de estado.

**Decisão**
"Evoluir Estratégia" é uma ação originada dentro do módulo Aprendizado. Não é um módulo, não aparece na sidebar como destino próprio.

**Justificativa**
Não tem conteúdo persistente para navegar — é o gatilho que encerra a Estratégia ativa e inicia a próxima (Blueprint, Cap. 4, "Evoluir Estratégia — fechar e reabrir o ciclo").

**Impacto**
RFCs não devem propor uma "tela de Evoluir Estratégia" como módulo de primeira classe; deve ser modelada como transição de estado disparada a partir de Aprendizado.

---

### ADR-003 — Existe apenas uma Estratégia ativa por Workspace

**Data:** 2026-07-26
**Status:** Aceita

**Contexto**
O modelo de domínio (Blueprint, Cap. 3.3) permite múltiplas Estratégias por Workspace ao longo do tempo, o que exige definir quantas podem estar "em curso" simultaneamente.

**Decisão**
A qualquer momento, um Workspace tem exatamente uma Estratégia ativa. Toda Execução, Growth e Aprendizado do presente pertence a essa única Estratégia ativa.

**Justificativa**
Sem essa regra, o Breadcrumb e o Contexto Estratégico (Blueprint, Cap. 3.6) perderiam significado — não haveria como responder "para qual Estratégia essa Ação contribui".

**Impacto**
Nenhuma RFC pode propor execução simultânea em duas Estratégias, nem uma interface que sugira múltiplos focos estratégicos ativos ao mesmo tempo.

---

### ADR-004 — Estratégias encerradas nunca voltam a receber Execução

**Data:** 2026-07-26
**Status:** Aceita

**Contexto**
Definido explicitamente no Blueprint (Cap. 3.6, "O que acontece quando uma Estratégia evolui") e reforçado no Cap. 4.

**Decisão**
Quando uma Estratégia é encerrada (via "Evoluir Estratégia"), ela permanece consultável e comparável no Contexto Global, mas nenhuma nova Ação, Campanha ou Experimento pode nascer dentro dela.

**Justificativa**
Preserva a integridade histórica — uma Estratégia encerrada é um registro fechado da memória estratégica da empresa (Blueprint, Cap. 4, "O estado ideal da VEKTOR"), não um documento reaberto e alterado retroativamente.

**Impacto**
Toda RFC de Execução deve validar que a Estratégia-alvo é a Estratégia ativa antes de permitir criação de Campanha, Tática, Ação ou Experimento.

---

### ADR-005 — Relatórios possuem visão Estratégica e visão Global

**Data:** 2026-07-26
**Status:** Aceita

**Contexto**
Identificado como inconsistência durante a revisão geral do Blueprint — Relatórios estava descrito ora como escopado apenas à Estratégia ativa, ora como comparando ciclos inteiros — e corrigido no Cap. 3.6.

**Decisão**
O módulo Relatórios tem duas visões: (1) da Estratégia ativa, escopada ao Contexto Estratégico; (2) histórica do Workspace, escopada ao Contexto Global, comparando Estratégias ao longo do tempo.

**Justificativa**
Um relatório de uso interno do dia a dia tem audiência e propósito diferente de um relatório para o C-level mostrar evolução (Blueprint, Cap. 2, persona Marina).

**Impacto**
RFCs de Relatórios devem declarar explicitamente a qual das duas visões pertencem — não existe uma terceira visão "geral" ambígua.

---

### ADR-006 — Growth Module ≠ Growth Framework

**Data:** 2026-07-26
**Status:** Aceita

**Contexto**
Risco de confusão terminológica identificado na revisão geral do Blueprint (Cap. 1, 3 e 6): "Growth" era usado tanto para um estágio único do ciclo quanto para o processo inteiro descrito no Cap. 6.

**Decisão**
"Growth" (módulo) é a superfície de navegação onde o usuário vê Evidência, Hipótese e recomendação. "Growth Framework" é o processo operacional completo que atravessa Execução → Growth → Aprendizado, incluindo a transição "Evoluir Estratégia".

**Justificativa**
Sem essa distinção, fica ambíguo se uma funcionalidade "de Growth" deve viver na tela do módulo ou é uma responsabilidade que atravessa múltiplos módulos.

**Impacto**
RFCs devem especificar se a mudança afeta o módulo Growth (interface/dados daquela tela) ou o Growth Framework como processo (podendo tocar Execução e Aprendizado também).

---

### ADR-007 — Contexto Global ≠ Contexto Estratégico

**Data:** 2026-07-26
**Status:** Aceita

**Contexto**
Definido no Blueprint (Cap. 3.6) como os dois níveis permanentes de navegação da plataforma.

**Decisão**
Contexto Global (Workspace) nunca muda ao navegar entre Estratégias e concentra o histórico completo. Contexto Estratégico (Estratégia Ativa) é onde o trabalho do dia a dia acontece e muda quando o usuário evolui ou consulta outra Estratégia.

**Justificativa**
Sem essa separação explícita, cada módulo reimplementaria sua própria noção de escopo, gerando inconsistência entre Execução, Growth, Aprendizado e Relatórios.

**Impacto**
Todo módulo novo deve declarar explicitamente a qual contexto pertence (Global, Estratégico, ou ambos — como a Sidebar).

---

### ADR-008 — Toda operação nasce dentro de uma Estratégia

**Data:** 2026-07-26
**Status:** Aceita

**Contexto**
Princípio arquitetural nº1 do Blueprint (Cap. 3.1) e reforçado como regra de interação no Cap. 4 ("Regra de entrada, não só princípio").

**Decisão**
Não existe criação de Campanha, Tática, Ação ou Experimento fora do contexto de uma Estratégia. Não há um "+ Nova Campanha" independente.

**Justificativa**
É a materialização direta do princípio do Canon "toda estratégia deve evoluir" — sem essa regra, a Execução poderia existir desconectada de qualquer intenção estratégica, exatamente o problema que a VEKTOR existe para resolver (Blueprint, Cap. 1, "Problemas que o VEKTOR resolve").

**Impacto**
Toda RFC que proponha uma nova forma de criar Campanha, Tática, Ação ou Experimento deve exigir uma Estratégia ativa como pré-condição.

---

### ADR-009 — IA é uma capacidade transversal da plataforma

**Data:** 2026-07-26
**Status:** Aceita

**Contexto**
Definido no Canon ("A IA é um copiloto") e detalhado por módulo no Blueprint (Cap. 4, 5 e 6).

**Decisão**
A IA não é um módulo, produto ou chat isolado. Ela participa dentro de cada módulo (Estratégia, Execução, Growth, Aprendizado) com capacidades específicas ao contexto daquele módulo, sempre como copiloto — nunca como protagonista de decisão estratégica.

**Justificativa**
Um "módulo de IA" separado reproduziria exatamente o problema que o Canon rejeita — "IA como acessório" (Blueprint, Cap. 1, Problema nº5).

**Impacto**
Nenhuma RFC deve propor uma tela ou módulo "de IA" isolado. Toda capacidade de IA deve ser modelada como extensão de um módulo existente — ver [`architecture/ai.md`](./architecture/ai.md).

---

### ADR-010 — Product Blueprint v1.0 congelado; evolução funcional passa a ocorrer via RFC

**Data:** 2026-07-26
**Status:** Aceita

**Contexto**
Com o Product Canon e o Product Blueprint v1.0 concluídos e a camada de governança documental estabelecida (este documento, `architecture/*.md` e `rfc/README.md`), era necessário definir como o produto evolui a partir daqui sem reabrir os documentos fundacionais a cada mudança.

**Decisão**
O Product Blueprint entra em estado congelado (frozen) na v1.0. A partir de agora:
- o Product Canon muda apenas em casos excepcionais;
- o Product Blueprint muda apenas mediante uma nova decisão arquitetural registrada aqui;
- toda evolução funcional da VEKTOR acontece por meio de RFCs ([`rfc/README.md`](./rfc/README.md)), nunca editando o Blueprint diretamente.

Também fica registrado que o teste de aceite do Blueprint (Cap. 3.7) passa a ter 5 perguntas — a quinta, "Esta decisão reduz a complexidade para o usuário?", vem diretamente do Product Canon ("Toda decisão de UX deve reduzir complexidade") e é obrigatória em toda RFC futura.

**Justificativa**
Sem um estado congelado, cada RFC teria autoridade implícita para reinterpretar o Blueprint, corroendo a hierarquia Canon → Blueprint → RFCs → Implementação estabelecida na seção Governança do Blueprint. Adicionar o teste de simplicidade ao checklist formaliza que simplicidade é princípio arquitetural, não só diretriz de UX — corrigindo uma lacuna identificada na revisão geral do Blueprint (o Canon já tinha esse princípio; o checklist de aceite ainda não o testava).

**Impacto**
Toda RFC deve responder "sim" à pergunta de complexidade antes de ser considerada aprovada ([`rfc/README.md`](./rfc/README.md), Checklist). Nenhuma RFC edita `product-canon.md` ou `product-blueprint.md` diretamente — mudanças estruturais passam primeiro por um novo ADR aqui.

---

### ADR-011 — Entidade Membro ratificada

**Data:** 2026-07-27
**Status:** Aceita

**Contexto**
`ARCHITECTURE_RESOLUTION.md` (A1) registrou que a entidade Membro nunca foi formalmente ratificada, apesar de já estar pressuposta em `conceptual-model.md`, `rls-policies.md` e nas colunas `*_by` de `schema.ts` (todas sem FK, com `TODO(A1)`). Isso bloqueava toda FK de autoria/aprovação e toda política de RLS que depende de `members.status`.

**Decisão**
Membro é ratificado como entidade de Identity/Access — fora das nove entidades do ciclo (`architecture/domain.md` permanece inalterado) — modelada como tabela de junção entre `workspaces` e a identidade de autenticação (`auth.users`), com os seguintes campos: `id`, `workspace_id`, `user_id` (nullable — ver ADR de A3, já aceito), `email`, `status` (`convidado|ativo|removido`), `role` (ver ADR-012), `invited_by`, `invited_at`, `joined_at`, `created_at`. Unicidade: `(workspace_id, email)` e `(workspace_id, user_id)` onde `user_id` não é nulo. Um usuário pode ter uma linha de Membro em mais de um Workspace.

**Justificativa**
É a única estrutura compatível com três decisões já aceitas: A3 (convite com `user_id` nullable), A4 (revogação checada por requisição, nunca por claim cacheado — exige tabela real) e A7 (função `security definer` consultando uma tabela real para evitar recursão de RLS). Nenhuma alternativa (perfil único sem tabela de junção, ou usar `auth.users.id` diretamente como dono) sustenta essas três decisões simultaneamente.

**Impacto**
Toda coluna `*_by` já existente em `schema.ts` (`strategy_steps.approved_by`, `campaigns.created_by`, `actions.approved_by`, `hypotheses.created_by`, `experiments.approved_by`, `learnings.created_by`, `integrations.created_by`) passa a ter destino formal de FK composta `(workspace_id, members.id)` — a adição da FK em si é trabalho de implementação, não desta decisão. Migration 1 de `migrations-strategy.md` (`workspaces`, `members`) pode ser gerada. `docs/database/logical-model.md`, `physical-model.md` e `rls-policies.md` devem incorporar esta estrutura na próxima revisão desses documentos.

---

### ADR-012 — RBAC mínimo: dois níveis de autoridade (`admin` / `membro`)

**Data:** 2026-07-27
**Status:** Aceita

**Contexto**
`ARCHITECTURE_RESOLUTION.md` (A2) registrou, a partir de achados de Threat Modeling (AZ-1/AZ-2/AZ-3), que a ausência de qualquer distinção de autoridade entre Membros permite que qualquer um convide, remova, aprove ou dispare "Evoluir Estratégia". RFC-008 recusou deliberadamente propor essa estrutura, por não haver base documental para desenhá-la sozinha.

**Decisão**
São ratificados exatamente dois papéis por Membro (`members.role`): `admin` e `membro`. Nenhum papel adicional (`owner`, papéis por módulo, permissão granular por ação) é introduzido. Mapeamento de autoridade mínima por operação:

| Operação | Papel mínimo |
|---|---|
| Convidar/remover Membro, alterar `role` de outro Membro | `admin` |
| Alterar Integrações (Configurações) | `admin` |
| Aprovar etapa da formulação / aprovar Estratégia (síntese) | `admin` |
| Disparar "Evoluir Estratégia" | `admin` |
| Aprovar Experimento (transição Proposto → Aprovado) | `admin` |
| Criar/aprovar Campanha, Tática, Ação | `membro` (qualquer papel) |
| Registrar Hipótese, propor Experimento, registrar conteúdo de Aprendizado | `membro` (qualquer papel) |
| Leitura de qualquer módulo dentro do Workspace | `membro` e `admin` igualmente |

Esta decisão resolve, como consequência direta, o Bloqueador 3 de `ARCHITECTURE_RESOLUTION.md` (B2/B3) e RFC-003/RFC-004 ("quem aprova um Experimento"): a resposta é "qualquer Membro do Workspace com `role = 'admin'`".

**Justificativa**
Dois papéis é o mínimo literalmente pedido por A2 ("ao menos dois níveis de autoridade"). Um terceiro papel (`owner`) exigiria um conceito de propriedade/faturamento que nenhuma fonte documenta — RFC-008 exclui faturamento explicitamente do escopo. RBAC granular por ação contraria a recusa explícita de RFC-008 em propor estrutura e não tem justificativa dado o ICP (times de 2 a 15 pessoas, Blueprint Cap. 2).

**Impacto**
`members.role` (enum `admin|membro`) é adicionado à mesma migration de `members` (ADR-011) — nenhuma migration adicional. Toda operação sensível listada na tabela acima passa a exigir, na camada Service, checagem de `member.role === 'admin'` antes de qualquer escrita — a Regra Absoluta nº9 de `IMPLEMENTATION_STANDARDS.md` exige essa checagem como parte obrigatória da implementação dessas operações, não mais como decisão em aberto. RFCs a atualizar para referenciar esta decisão em vez de registrar a lacuna como aberta: RFC-001 (aprovação de etapa/síntese), RFC-003 e RFC-004 (aprovação de Experimento), RFC-005 (disparo de "Evoluir Estratégia") e RFC-008 (estrutura de Equipe/Permissões).

---

### ADR-013 — Criação de Workspace é self-service

**Data:** 2026-07-27
**Status:** Aceita

**Contexto**
`ARCHITECTURE_RESOLUTION.md` (A5) registrou que nenhuma fonte definia se a criação de Workspace é auto-serviço ou administrada, nem quem se torna o primeiro Membro com autoridade plena.

**Decisão**
Qualquer usuário autenticado (via Supabase Auth) pode criar um Workspace diretamente, informando apenas o nome. Na mesma transação: (1) cria-se a linha em `workspaces`; (2) cria-se a primeira linha em `members` para esse usuário, com `status = 'ativo'`, `role = 'admin'` (ADR-012) e `joined_at = now()`. Nenhum limite de quantos Workspaces um usuário pode criar ou a quantos pode pertencer é imposto por esta decisão.

**Justificativa**
É a leitura mais direta de Blueprint Cap. 4 ("uma empresa chega ao VEKTOR e cria seu Workspace"), consistente com o padrão de acesso self-service que a stack (Next.js + Supabase, CLAUDE.md) pressupõe, e evita inventar um processo administrativo/comercial que nenhuma fonte menciona. Tornar o criador `admin` automaticamente é a única leitura possível de "primeiro Membro com autoridade plena" dado o RBAC de ADR-012.

**Impacto**
Não introduz tabela nova. A responsabilidade de orquestrar essa transação (criar Workspace + criar Membro `admin`) não pertence a nenhum dos sete Services de módulo (Workspace não é um módulo do Blueprint) — deve ser implementada como um `WorkspaceService` transversal e pequeno, análogo em escopo à forma como Dashboard (ADR-001) existe sem ser módulo. `docs/database/rls-policies.md` deve registrar que `workspaces.insert` é permitido para qualquer usuário autenticado, não apenas via fluxo administrativo.

---

### ADR-014 — Propagação de contexto autenticado: transação por requisição, `service_role` nunca em caminho de usuário final

**Data:** 2026-07-27
**Status:** Aceita

**Contexto**
`ARCHITECTURE_RESOLUTION.md` (A9) fixou a direção ("backend opera no contexto de usuário autenticado por padrão, `service_role` reservado a tarefas administrativas") mas deixou o desenho técnico em aberto. `docs/database/rls-policies.md`, na sua redação atual, contradiz essa direção ao afirmar que "toda escrita feita pelo backend usa a `service_role`, que ignora RLS por padrão" — o que esvaziaria a Regra Absoluta nº7 de `IMPLEMENTATION_STANDARDS.md` (RLS como defesa em profundidade) para 100% do tráfego de usuário final.

**Decisão**
Toda Server Action/Route Handler, a partir da primeira consulta, executa dentro de uma transação Postgres que define a role de sessão como `authenticated` e popula a variável de sessão equivalente a `auth.uid()` com o id do usuário resolvido no servidor via Supabase Auth — inclusive para a consulta inicial de quais Workspaces o usuário pertence, usando a função `security definer` já decidida em A7 (`docs/database/rls-policies.md`). **Nenhum caminho de usuário final usa `service_role`.** `service_role` fica reservado exclusivamente a jobs em background e migrations, sem sessão de usuário associada.

**Justificativa**
É a única opção compatível simultaneamente com a Regra Absoluta nº3 ("nunca usar `service_role` para contornar autorização"), a Regra Absoluta nº7 (RLS testada com negação cruzada real) e as restrições de ambiente serverless do stack (Next.js/Vercel) — uma conexão dedicada por usuário sem pooling (alternativa descartada) esgotaria conexões Postgres rapidamente. O padrão de `SET LOCAL` por transação é compatível com pooling em modo transação (Supavisor), que é o padrão de conexão do Supabase.

**Impacto**
Corrige `docs/database/rls-policies.md`, seção "Papel da `service_role`" — o texto atual deve ser substituído para refletir esta decisão. Nenhuma mudança na assinatura pública de Repository ou Service (ambos já recebem `DbClient`/`Transaction` — `packages/db/src/transaction.ts`); a montagem da transação com contexto de sessão é uma responsabilidade nova da camada de Server Action, a especificar em `docs/implementation/backend/architecture.md` quando esse documento for escrito.

---

### ADR-015 — Estratégia é ativa desde o início da formulação

**Data:** 2026-07-27
**Status:** Aceita

**Contexto**
RFC-001 assumiu, sem confirmação, que uma Estratégia conta como "ativa" (para fins de ADR-003) desde o início da formulação, não apenas após a aprovação da síntese — e marcou essa leitura como pendente de confirmação (`ARCHITECTURE_RESOLUTION.md`, A12).

**Decisão**
Confirma-se a leitura de RFC-001: uma Estratégia nasce com `status = 'ativa'` no momento em que sua formulação é iniciada — não existe um terceiro estado "em formulação"/rascunho distinto de "ativa". "Ativa" não significa "liberada para handoff automático de Execução": o handoff (geração de proposta de Campanha/Tática/Ação) só ocorre após a aprovação da etapa 11 (síntese, RFC-001). Criação manual de Campanha durante a formulação, antes da síntese, já é permitida por RFC-002 critério 4 desde que a Estratégia esteja `ativa` — esta decisão não altera essa permissão, apenas a confirma como consistente.

**Justificativa**
Um terceiro estado exigiria alterar o enum `strategy_status` (hoje binário: `ativa|encerrada`) e o diagrama de estados de `architecture/navigation.md` (`SemEstrategiaAtiva → Ativa → Encerrada`, sem nó intermediário), sem nenhum ganho funcional — a única coisa que um estado "rascunho" impediria (handoff automático) já é impedida pela ausência de síntese aprovada, independentemente do rótulo de `status`. Introduzir esse terceiro estado violaria o princípio de simplicidade do Canon sem resolver nenhuma ambiguidade real.

**Impacto**
Nenhuma mudança de schema (o enum já suportava esta leitura). RFC-001 deve remover a ambiguidade registrada em "Fluxos" e referenciar este ADR. `docs/database/migrations-strategy.md` (Migration 2) pode remover a ressalva "ambiguidade... confirmada" como pré-requisito pendente.

---

### ADR-016 — Registro independente de Evidência

**Data:** 2026-07-27
**Status:** Aceita

**Contexto**
RFC-002 (Execução), na especificação original, descreve um único caminho de produção de Evidência: como efeito colateral automático de `ExecucaoService.concluirAcao`, na mesma transação que transiciona a Ação de `em_execucao` para `concluida`/`publicada` (RFC-002, critério nº5; RFC-004). Durante a implementação da UI do módulo Execução foi identificado que essa é a única via existente para registrar uma Evidência — nenhum Service expõe um método que crie uma `Evidence` sem, ao mesmo tempo, concluir a Ação à qual ela pertence. Isso impedia registrar uma Evidência intermediária enquanto a Ação ainda está em execução, ou mais de uma Evidência ao longo do tempo para a mesma Ação, contradizendo a própria modelagem de `evidences` (tabela multi-linha e append-only, sem limite de quantidade por Ação — `docs/database/logical-model.md`).

**Decisão**
`ExecucaoService.registrarEvidencia(actor, actionId, input)` é ratificado como um segundo mecanismo, explícito e independente, de criação de `Evidence` — puramente aditivo, nunca alterando o `status` da Ação. O registro é permitido nos estados `em_execucao`, `concluida` e `publicada`; é proibido em `proposta` e `aprovada` (a Ação ainda não começou a ser executada, não há o que evidenciar), caso em que lança `AcaoNaoIniciadaError` (`packages/services/src/shared/errors.ts`) antes de qualquer escrita. O fluxo automático já existente — `concluirAcao` produzindo Evidência na mesma transação da transição de status (RFC-002, critério nº5) — permanece inalterado, sem nenhuma mudança de assinatura ou comportamento.

**Justificativa**
Das três alternativas avaliadas — (1) reaproveitar `concluirAcaoAction` como "Registrar Evidência", sem mudança de Service, mas fundindo permanentemente as duas operações; (2) um novo método de Service que cria a Evidência isoladamente, sem transicionar `status`; (3) resolver via múltiplas chamadas na camada de UI, sem mudança de Service — apenas a (2) preserva a distinção semântica entre "evidenciar" e "concluir" já pressuposta pela modelagem multi-linha de `evidences`, sem deslocar uma decisão de domínio para a camada de apresentação, como faria a alternativa (3) ao contrariar a separação de responsabilidades já estabelecida em `backend/services.md`.

**Impacto**
`Evidence` passa a ter duas vias de criação legítimas — automática e independente — ambas convergindo para `EvidencesRepository.create`, sem duplicar a escrita; uma Ação pode acumular múltiplas Evidências ao longo do tempo, inclusive antes e depois de concluída. Nenhuma mudança de schema, Repository ou contrato público de método já existente. Não contraria nenhum Critério de aceite de RFC-002 — o critério nº5 permanece verdadeiro, apenas deixa de ser a única via de produção de Evidência; RFC-002 (critério nº5) já referencia este ADR. RFC-003 introduzirá Experimento como segunda origem polimórfica de Evidência (`evidences.experiment_id`, já suportado pelo schema desde a Fase 1) — este ADR estabelece o precedente de que Evidência pode ter mais de um mecanismo de criação, cada um com sua própria precondição de domínio, e RFC-003 deve tratar a via por Experimento como um terceiro mecanismo independente, não como extensão de `registrarEvidencia`.
