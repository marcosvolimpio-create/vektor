# Frontend — Routing

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.
>
> Convenção de implementação, não decisão de arquitetura de produto — por isso vive aqui, não em `DECISIONS.md` (que exclui explicitamente "decisões de implementação técnica... schema, framework") nem numa RFC (que exigiria seções de domínio/IA inaplicáveis a uma convenção de URL). Registrada aqui para não divergir entre sprints, com a mesma força prática de um ADR: nenhuma tela nova decide isso de novo.

## Objetivo

Mapear URLs aos dois Contextos de navegação e aos sete módulos da Sidebar oficial.

## Responsabilidade

Convenção de rota por módulo (Estratégico vs. Global, `architecture/navigation.md`); como o Breadcrumb (Estratégia › Campanha › Tática) se reflete na estrutura de rota.

## Convenção adotada (Fase 2, Sprint 1)

**Padrão de rota:** `/w/[workspaceId]/...` — todo módulo do Contexto Estratégico (Estratégia, Execução, Growth, Aprendizado) e a visão da Estratégia ativa de Relatórios vivem sob esse prefixo. Ex.: `/w/[workspaceId]/execucao/campanhas/[campaignId]`.

**`workspaceId` sempre vem da URL — nunca de estado de cliente.** É lido via `params` do App Router em cada página/layout sob `/w/[workspaceId]/` e repassado explicitamente a toda Server Action chamada a partir dali. Nenhum Zustand, nenhum cookie de "Workspace ativo" nesta convenção.

**A Estratégia ativa nunca entra na URL.** Não existe segmento `[strategyId]` para "qual é a Estratégia em curso" — ADR-003 garante no máximo uma Estratégia ativa por Workspace, então não há ambiguidade que uma URL própria precisasse resolver. (Uma Estratégia *específica*, ao ser consultada no Contexto Global — ex.: histórico em Relatórios/Biblioteca — usa seu próprio `strategyId` na rota daquele módulo; isso é uma Estratégia sendo *consultada*, não a Estratégia ativa sendo *identificada*, e está fora do escopo desta convenção.)

**A Estratégia ativa é sempre resolvida a partir do `workspaceId`**, chamando `obterEstrategiaAtivaAction(workspaceId)` a cada carregamento que precisar dela (Header, página inicial de um módulo do Contexto Estratégico) — nunca cacheada em estado de cliente entre navegações.

**Nenhuma camada abaixo da UI depende desta convenção.** Toda Server Action já existente (Fase 1 e Execução) recebe `workspaceId` como parâmetro explícito de função, não como algo que ela mesma extrai de uma URL ou cookie — a Composition Root, os Services e os Repositories nunca sabem que uma URL existe. Se uma RFC de UX futura mudar esta convenção (ex.: Workspace por subdomínio), a mudança fica inteiramente contida na camada de rota da UI.

**Relação com `frontend/state.md`:** esta convenção resolve, para esta fase, a pergunta que aquele documento reserva ("onde vive o estado de Workspace ativo/Estratégia Ativa no cliente") com a resposta "em lugar nenhum — é derivado da URL e resolvido a cada carregamento". Se uma necessidade real de estado de cliente surgir (ex.: troca de Workspace sem navegação completa), a decisão correspondente é registrada em `state.md`, não aqui — não uma contradição, uma fronteira entre os dois documentos.

## Conteúdo esperado

- Tabela módulo → padrão de rota (a expandir conforme Growth, Aprendizado, Relatórios, Biblioteca, Configurações ganharem tela).
- Regra explícita: Dashboard e "Evoluir Estratégia" não são destinos de rota própria (ADR-001, ADR-002).

## Relação com os documentos de produto

`architecture/navigation.md` (Sidebar, Breadcrumb, Seletor de Estratégia Ativa); ADR-003 (uma Estratégia ativa por Workspace — justifica por que ela não precisa de identificador próprio na URL).

## Dependências

`frontend/architecture.md`.

## O que NÃO pertence a este documento

Componente visual da tela (`frontend/components.md`), estado de qual Estratégia está selecionada quando isso deixar de ser derivável só da URL (`frontend/state.md`).
