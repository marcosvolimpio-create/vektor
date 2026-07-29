# Deployment — Environments

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Documentar os ambientes de execução (CLAUDE.md: Vercel) e como Workspace/tenant se relaciona com eles.

## Responsabilidade

Definição de dev/staging/produção; variáveis de ambiente, incluindo chaves de IA (`ai/providers.md`) e conexão Supabase (`database/*`).

## Conteúdo esperado

Tabela de variáveis por ambiente; processo de provisionamento de projeto Supabase por ambiente — não por Workspace: todos os Workspaces de produção compartilham o mesmo banco, isolados por RLS (`database/rls.md`).

## Relação com os documentos de produto

Nenhuma diretamente — ambiente de deploy é decisão técnica; a stack em si vem de CLAUDE.md.

## Dependências

Nenhuma dentro da documentação de produto.

## O que NÃO pertence a este documento

Pipeline de deploy em si (`deployment/ci-cd.md`), observabilidade (`deployment/monitoring.md`).
