# Database — Migrations

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Documentar o processo de evolução do schema ao longo do tempo — não o seu estado alvo.

## Responsabilidade

Convenção de nomenclatura de migration, ordem de aplicação, estratégia de rollback, uso do Drizzle Kit (CLAUDE.md, Technology Stack → ORM).

## Conteúdo esperado

- Convenção de nome e numeração de migration.
- Checklist pré-migration: nenhuma migration que altere o estado de Campanha/Tática pode ser escrita antes de o Bloqueador 2 fechar em Review.
- Processo de revisão de migration em Pull Request.
- Estratégia de rollback por tipo de mudança (aditiva vs. destrutiva).

## Relação com os documentos de produto

Nenhuma diretamente — é processo técnico. Referencia [`database/schema.md`](./schema.md) para saber o que está sendo migrado.

## Dependências

`database/schema.md`.

## O que NÃO pertence a este documento

Definição de tabelas em si (`schema.md`), políticas de segurança em nível de banco (`rls.md`).
