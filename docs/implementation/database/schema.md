# Database — Schema

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Traduzir as nove entidades oficiais de [`architecture/domain.md`](../../architecture/domain.md) — mais a entidade de Membro, ratificada por ADR-011 (`DECISIONS.md`) — em tabelas físicas, sem redefinir domínio.

## Responsabilidade

Mapear entidade → tabela, tipos de coluna e chaves estrangeiras refletindo exatamente a hierarquia já fixada: Workspace → Estratégia → Campanha → Tática → Ação; Evidência ↔ Hipótese ↔ Experimento; Aprendizado.

## Conteúdo esperado

- Diagrama entidade-relacionamento.
- Uma tabela por entidade oficial, com colunas e chaves estrangeiras.
- Mapeamento de cada máquina de estados já definida pela [RFC-004](../../rfc/RFC-004-lifecycle-state-machine.md) (Ação, Hipótese, Experimento) para coluna de status/enum.
- Nota de bloqueio explícita para as colunas de Campanha/Tática (Bloqueador 2 — "lacuna plena" ainda não resolvida em Review, permanece aberto). A tabela de Membro (antes Bloqueador 1) já está ratificada — ADR-011, ADR-012 (`DECISIONS.md`) — e não exige mais nota de bloqueio.

## Relação com os documentos de produto

`architecture/domain.md` (lista fechada de entidades e relações "existe dentro de"); RFC-001, RFC-002, RFC-003, RFC-004, RFC-005 (regras de criação e estado); `DECISIONS.md` ADR-003, ADR-004, ADR-008.

## Dependências

[Implementation Plan](../../implementation-plan.md), Fase 0 e Fase 1; RFC-004 para nomenclatura de estado.

## O que NÃO pertence a este documento

Lógica de negócio (`backend/services.md`), políticas de acesso por linha (`database/rls.md`), processo de versionamento de schema (`database/migrations.md`). Nenhuma coluna criada aqui pode representar uma lacuna de produto resolvida silenciosamente — onde a fonte é uma lacuna registrada, o schema aguarda a Fase 0.
