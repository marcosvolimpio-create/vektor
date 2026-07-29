# Testing — Unit

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Definir o escopo de teste unitário: services, validation e repositories isolados por mock, sem banco real.

## Responsabilidade

Garantir que cada invariante de `backend/validation.md` tenha um teste unitário próprio.

## Conteúdo esperado

Convenção de mock; lista de invariantes por ADR com teste unitário obrigatório correspondente.

## Relação com os documentos de produto

`DECISIONS.md` — cada ADR de regra de domínio vira, no mínimo, um teste unitário; Critérios de aceite unitários por RFC.

## Dependências

`testing/strategy.md`.

## O que NÃO pertence a este documento

Teste com banco real (`testing/integration.md`), teste de fluxo completo entre módulos (`testing/e2e.md`).
