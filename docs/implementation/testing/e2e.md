# Testing — End-to-End

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Definir o escopo de teste end-to-end do ciclo completo da VEKTOR, conforme a Fase 10 do [Implementation Plan](../../implementation-plan.md).

## Responsabilidade

Cobrir o cenário "Estratégia → Execução → Growth → Aprendizado → Evoluir Estratégia → nova Estratégia" de ponta a ponta, além de testes de isolamento multi-tenant (um Workspace nunca vê dado de outro).

## Conteúdo esperado

Cenários E2E nomeados, cada um referenciando explicitamente as RFCs que atravessa.

## Relação com os documentos de produto

O princípio do Product Canon — "execução gera dados. dados geram aprendizado. aprendizado gera evolução" — é literalmente o roteiro do teste E2E principal.

## Dependências

`testing/integration.md`; [Implementation Plan](../../implementation-plan.md), Fase 10.

## O que NÃO pertence a este documento

Teste de uma única camada ou módulo isolado — isso é `testing/unit.md` ou `testing/integration.md`.
