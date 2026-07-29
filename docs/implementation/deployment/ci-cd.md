# Deployment — CI/CD

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Documentar o pipeline de integração e entrega contínua.

## Responsabilidade

Quais checks bloqueiam merge/deploy (typecheck, lint, testes — `testing/*`); ordem de deploy entre ambientes.

## Conteúdo esperado

Diagrama de pipeline; gate de qualidade por etapa; política de rollback.

## Relação com os documentos de produto

Nenhuma diretamente.

## Dependências

`deployment/environments.md`; `testing/strategy.md`.

## O que NÃO pertence a este documento

Definição dos próprios testes (`testing/*`), configuração de ambiente (`deployment/environments.md`).
