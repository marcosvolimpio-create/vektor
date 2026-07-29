# Frontend — Architecture

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Organizar o frontend (Next.js App Router, React 19 — CLAUDE.md) mapeado aos dois Contextos de navegação oficiais definidos em [`architecture/navigation.md`](../../architecture/navigation.md): Global e Estratégico.

## Responsabilidade

Estrutura de pastas por módulo; convenção de Server Components vs. Client Components (CLAUDE.md: "server components sempre que apropriado"); onde o Dashboard composto (ADR-001) e a Sidebar (`navigation.md`) vivem estruturalmente no código.

## Conteúdo esperado

- Árvore de rotas de alto nível, organizada por Contexto (Global/Estratégico).
- Convenção de layout compartilhado (Sidebar, Seletor de Workspace/Estratégia Ativa).

## Relação com os documentos de produto

`architecture/navigation.md` (única fonte de verdade da estrutura de navegação); ADR-001, ADR-002, ADR-007.

## Dependências

[Implementation Plan](../../implementation-plan.md), Fase 7. **Lacuna registrada em todas as oito RFCs: nenhuma tela está definida nas fontes** — este documento organiza estrutura de código, nunca decide UI.

## O que NÃO pertence a este documento

Decisão visual de tela ou componente — nenhuma fonte de produto define isso hoje (ver o mesmo limite em `frontend/components.md`); gerenciamento de estado (`frontend/state.md`).
