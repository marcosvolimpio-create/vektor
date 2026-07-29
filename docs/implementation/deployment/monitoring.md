# Deployment — Monitoring

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Observabilidade em produção — logs, erros, métricas de uso técnico, incluindo custo/uso de IA (capacidade transversal, ADR-009).

## Responsabilidade

O que é monitorado por módulo; alertas por violação de invariante em produção (ex.: uma tentativa de criar Ação em Estratégia encerrada chegando à camada de aplicação nunca deveria acontecer se `backend/validation.md` funciona corretamente — se acontecer, é alerta de regressão).

## Conteúdo esperado

Lista de métricas técnicas e de infraestrutura. **Cuidado explícito de escopo:** métricas de produto voltadas ao usuário final (ex.: taxa de Hipótese Validada vs. Refutada) não pertencem aqui — são o módulo Relatórios (RFC-007), não infraestrutura.

## Relação com os documentos de produto

Nenhuma diretamente — este documento é operação da plataforma, não o módulo Relatórios (RFC-007), que é produto.

## Dependências

`deployment/environments.md`.

## O que NÃO pertence a este documento

Métricas de produto voltadas ao usuário final — isso é RFC-007 / Relatórios, um módulo de produto, não uma preocupação de infraestrutura. Este documento não deve virar um "Relatórios paralelo".
