# AI — Providers

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Documentar a integração técnica com os provedores de IA definidos em CLAUDE.md (Anthropic, OpenAI, via Vercel AI SDK).

## Responsabilidade

Abstração de provider, gestão de credencial (via `deployment/environments.md`), estratégia de fallback entre provedores, se houver — decisão puramente técnica, sem exigência de nenhuma fonte de produto.

## Conteúdo esperado

Configuração do Vercel AI SDK; convenção de qual provider é usado por tipo de tarefa.

## Relação com os documentos de produto

Nenhuma diretamente — CLAUDE.md define a stack; `architecture/ai.md` não menciona provedor específico.

## Dependências

`deployment/environments.md` (variáveis de ambiente e chaves).

## O que NÃO pertence a este documento

Quais módulos usam IA e como — isso já está definido em `architecture/ai.md` e implementado em `ai/prompts.md`. Este documento é apenas o encanamento técnico do provider.
