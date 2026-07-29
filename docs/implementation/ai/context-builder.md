# AI — Context Builder

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Especificar tecnicamente o "Context Builder" já definido em [`architecture/ai.md`](../../architecture/ai.md) — o que é montado antes de qualquer sugestão de IA.

## Responsabilidade

Implementar o princípio "Context Before Execution" (`ai.md`): Workspace ativo, Estratégia ativa e seus Objetivos, posição no domínio onde a sugestão é pedida, Evidência e Aprendizado acumulados relevantes.

## Conteúdo esperado

Como cada um dos quatro elementos do Context Builder é obtido tecnicamente (via `backend/repositories.md`); formato do objeto de contexto passado ao provider de IA.

## Relação com os documentos de produto

`architecture/ai.md` — seção "Context Builder" e "Princípios da IA" nº2. Este documento implementa o que já está definido; não redefine.

## Dependências

`backend/repositories.md`; [Implementation Plan](../../implementation-plan.md), Fase 8.

## O que NÃO pertence a este documento

O texto do prompt em si (`ai/prompts.md`), qual provider é chamado (`ai/providers.md`).
