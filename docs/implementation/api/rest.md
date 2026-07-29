# API — REST

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Documentar a superfície HTTP da VEKTOR — rotas, verbos, recursos — para os casos em que Server Actions (preferência declarada em CLAUDE.md) não se aplicam.

## Responsabilidade

Nomear explicitamente quando REST é necessário (ex.: webhooks de integração — [Implementation Plan](../../implementation-plan.md) Fase 9; consumo por cliente externo futuro) versus quando Server Actions bastam — a maioria das interações internas de UI, conforme CLAUDE.md: "server actions quando simplificam a arquitetura".

## Conteúdo esperado

- Tabela de rotas REST existentes — inicialmente mínima, crescendo apenas com a Fase 9.
- Convenção de nomenclatura de recurso por entidade.

## Relação com os documentos de produto

Nenhuma RFC exige REST especificamente — a escolha REST vs. Server Action é decisão técnica de CLAUDE.md, não de produto.

## Dependências

`backend/services.md`.

## O que NÃO pertence a este documento

Formato de payload (`api/contracts.md`), taxonomia de erro (`api/errors.md`).
