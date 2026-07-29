# Backend — Architecture

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Definir a organização de código do backend (camadas, pastas, limites de módulo) mapeando 1:1 para os módulos oficiais do Blueprint.

## Responsabilidade

Como Route Handlers e Server Actions (CLAUDE.md, Code Quality) se organizam por módulo (Estratégia, Execução, Growth, Aprendizado, Biblioteca, Relatórios, Configurações); como o Growth Framework (ADR-006), que atravessa três módulos, é representado em código sem duplicar lógica de Experimento/Evidência — risco já registrado no [Implementation Plan](../../implementation-plan.md), seção "Riscos arquiteturais" nº1.

## Conteúdo esperado

- Diagrama de camadas: API → Services → Repositories → Banco.
- Convenção de onde vive cada módulo no monorepo (`apps/web`, `packages/*`, conforme CLAUDE.md).
- Regra explícita: nenhum módulo implementa lógica de outro — ex.: Execução não implementa aprovação de Experimento; isso é Growth (RFC-003).

## Relação com os documentos de produto

RFC-001 a RFC-008 (limite de responsabilidade de cada módulo); ADR-006 (Growth Module ≠ Growth Framework); ADR-009 (IA é capacidade transversal, não módulo).

## Dependências

[Implementation Plan](../../implementation-plan.md), Fases 2 a 6.

## O que NÃO pertence a este documento

Lógica de negócio específica de um módulo (`backend/services.md`), acesso a dado (`backend/repositories.md`), contrato HTTP (`api/*`).
