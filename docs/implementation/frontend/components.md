# Frontend — Components

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Catalogar os componentes compartilhados (shadcn/ui, CLAUDE.md) e por onde a UI de cada módulo deve ser organizada — sem desenhar a UI em si.

## Responsabilidade

Convenção de componente reutilizável vs. componente específico de módulo; onde entram os componentes de shadcn/ui já disponíveis em `packages/ui` (fundação técnica existente).

## Conteúdo esperado

- Lista de componentes compartilhados com especificação funcional real: Sidebar, Breadcrumb, Seletor de Workspace, Seletor de Estratégia Ativa (`architecture/navigation.md`).
- Para todo o restante: referência explícita à lacuna — **nenhuma tela ou componente de conteúdo está definida em nenhuma RFC**. Este documento não a inventa.

## Relação com os documentos de produto

`architecture/navigation.md` — os únicos elementos de UI com especificação funcional documentada hoje.

## Dependências

[Implementation Plan](../../implementation-plan.md), Fase 7 — pré-requisito: rodada de UX/wireframe, fora do escopo de qualquer RFC.

## O que NÃO pertence a este documento

Decisão de layout, cor ou tipografia — não documentada em nenhuma fonte de produto. Qualquer decisão desse tipo pertence a uma futura iteração de design, não a este documento.
