# Backend — Repositories

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Documentar a camada de acesso a dado — uma abstração sobre o schema (Drizzle ORM, CLAUDE.md) por entidade.

## Responsabilidade

Um repositório por entidade oficial de [`architecture/domain.md`](../../architecture/domain.md), mais um repositório de Membro (ratificado por ADR-011, `DECISIONS.md`), sem nenhuma lógica de negócio.

## Conteúdo esperado

- Interface por repositório (métodos de leitura/escrita).
- Escopo obrigatório por `workspace_id` em toda consulta — reforço em nível de aplicação da mesma regra imposta em nível de banco por `database/rls.md`.

## Relação com os documentos de produto

`architecture/domain.md` (lista de entidades e suas relações "existe dentro de").

## Dependências

`database/schema.md`.

## O que NÃO pertence a este documento

Regra de negócio (`backend/services.md`), política de segurança em nível de banco (`database/rls.md`).
