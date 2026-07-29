# Frontend — State

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Documentar o gerenciamento de estado client-side: dado de servidor (TanStack Query) vs. estado local (Zustand, "somente quando necessário" — CLAUDE.md, State).

## Responsabilidade

Onde vive o estado de "Estratégia Ativa" (Seletor de Estratégia Ativa, `architecture/navigation.md`) e "Workspace ativo" (Seletor de Workspace) no cliente; cache de dado de servidor por módulo.

## Conteúdo esperado

- Lista de estado client-side necessário: Estratégia ativa selecionada, Workspace ativo.
- Convenção de invalidação de cache do TanStack Query por mutação (ex.: aprovar a síntese da Estratégia invalida a query da proposta de handoff).

## Relação com os documentos de produto

`architecture/navigation.md` — os dois seletores contextuais (Workspace, Estratégia Ativa) são a origem funcional deste estado.

## Dependências

`frontend/architecture.md`; `backend/services.md` (formato de dado consumido).

## O que NÃO pertence a este documento

Estrutura de rota (`frontend/routing.md`), definição de componente (`frontend/components.md`).
