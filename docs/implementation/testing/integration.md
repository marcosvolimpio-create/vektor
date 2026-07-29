# Testing — Integration

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Definir o escopo de teste de integração: API e banco real, dentro dos limites de um único módulo.

## Responsabilidade

Validar que um módulo (ex.: Execução, RFC-002) funciona de ponta a ponta contra o schema real, incluindo as políticas de RLS.

## Conteúdo esperado

Cenários de teste por módulo, mapeados aos Critérios de aceite de cada RFC que exigem persistência real (ex.: RFC-002 nº2 — hierarquia Ação/Tática/Campanha).

## Relação com os documentos de produto

Critérios de aceite das RFCs que envolvem mais de uma entidade persistida.

## Dependências

`testing/strategy.md`; `database/schema.md`.

## O que NÃO pertence a este documento

Teste isolado de função (`testing/unit.md`), fluxo cross-módulo completo (`testing/e2e.md`).
