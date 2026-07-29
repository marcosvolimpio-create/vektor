# API — Contracts

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Documentar o formato (shape) de entrada e saída de cada endpoint/Server Action, via schemas Zod (CLAUDE.md, Validation).

## Responsabilidade

Um contrato por operação exposta, validando forma de dado na borda — não regra de negócio (isso é `backend/validation.md`).

## Conteúdo esperado

- Schema Zod por operação.
- Tipos compartilhados via `packages/types` (fundação técnica já existente).
- Exemplo de payload por Critério de aceite relevante da RFC de origem.

## Relação com os documentos de produto

Os Critérios de aceite das RFCs definem o que cada operação precisa aceitar/retornar como verificável.

## Dependências

`api/rest.md` ou `backend/services.md` (quando a operação é uma Server Action).

## O que NÃO pertence a este documento

Verificação de invariante de domínio (`backend/validation.md`); lista de rotas HTTP em si (`api/rest.md`).
