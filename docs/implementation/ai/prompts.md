# AI — Prompts

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Catalogar os templates de prompt por módulo e tarefa, exatamente conforme a tabela "Como a IA participa de cada módulo" em [`architecture/ai.md`](../../architecture/ai.md).

## Responsabilidade

Um template por capacidade documentada — ex.: sugestão de SWOT (RFC-001), sugestão de priorização de Ação (RFC-002), sugestão de Hipótese (RFC-003), resumo de Aprendizado (RFC-005). **Nenhum template para Relatórios, Biblioteca ou Configurações** — `ai.md` é explícito: sem participação de IA definida para esses três no Blueprint v1.

## Conteúdo esperado

Template por capacidade, tendo o Context Builder (`ai/context-builder.md`) como entrada obrigatória; guard-rails textuais que impedem o prompt de ultrapassar os limites da lista "Nunca" de `ai.md` — ex.: nenhum prompt pode ser formulado para aprovar uma mudança estratégica sozinho.

## Relação com os documentos de produto

`architecture/ai.md` (tabela de participação, listas Pode/Nunca); RFC-001, RFC-002, RFC-003, RFC-005 (onde cada capacidade está documentada).

## Guard-rails contra Prompt Injection (F10, Threat Modeling Review)

Todo conteúdo de domínio que entra em um prompt — `strategy_steps.content`, `evidences.content`, `learnings.content`, e qualquer outro campo de texto livre controlado pelo usuário — é tratado **exclusivamente como dado a ser analisado, nunca como instrução a ser seguida**. Isso não altera nenhum fluxo de IA já existente (nenhum fluxo de IA está implementado ainda) — é um requisito obrigatório para quando a Fase 8 (`implementation-plan.md`) começar a escrever esses templates.

Regras obrigatórias para todo template desta pasta:

- O prompt de sistema (system prompt) define o papel, os limites (`architecture/ai.md`, listas "Pode"/"Nunca") e o formato de saída esperado — e sempre prevalece sobre qualquer conteúdo interpolado do domínio.
- Conteúdo de domínio é sempre interpolado em uma seção claramente delimitada e rotulada como dado (ex.: um bloco de "contexto observado"), nunca concatenado ao texto de instrução do prompt de forma indistinguível.
- Nenhuma instrução textual presente em Diagnóstico, Evidência, Aprendizado ou qualquer outro campo de domínio pode alterar o comportamento do modelo, mudar seu papel, ou revogar uma regra do prompt de sistema — mesmo que o conteúdo do usuário contenha algo formatado como uma instrução.
- Esta é uma camada adicional de defesa, não um substituto: a Regra Absoluta nº11 (`IMPLEMENTATION_STANDARDS.md` — IA nunca tem tool-calling vinculado a mutação de estado) continua sendo a proteção primária; mesmo que um prompt seja manipulado com sucesso, nenhuma saída de IA pode executar uma mutação diretamente.

## Dependências

`ai/context-builder.md`.

## O que NÃO pertence a este documento

Qual provider processa o prompt (`ai/providers.md`); qualquer capacidade de IA não listada em `architecture/ai.md` — não pode ser adicionada aqui sem uma RFC própria.
