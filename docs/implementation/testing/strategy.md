# Testing — Strategy

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Visão geral da estratégia de teste, ancorada na Fase 10 do [Implementation Plan](../../implementation-plan.md) e no fato de que cada RFC já produziu Critérios de aceite verificáveis por construção.

## Responsabilidade

Definir a pirâmide de teste (unit/integration/e2e) e a regra-guia: todo Critério de aceite não marcado como "pendente de Review" em sua RFC de origem deve ter teste correspondente antes de a fase correspondente do Implementation Plan ser considerada concluída.

## Conteúdo esperado

Mapeamento RFC → Critérios de aceite → nível de teste apropriado (unit, integration ou e2e).

## Relação com os documentos de produto

Todas as RFCs (fonte dos Critérios de aceite) e o Implementation Plan (Fase 10, critérios de conclusão de fase).

## Dependências

Nenhuma outra dentro de `testing/` — é o documento-guarda-chuva desta pasta.

## O que NÃO pertence a este documento

Teste específico de uma camada — isso é `testing/unit.md`, `testing/integration.md` ou `testing/e2e.md`.
