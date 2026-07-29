# Backend — Validation

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Documentar onde e como os invariantes de domínio (ADRs e Critérios de aceite) são verificados no backend — distinto da validação de forma de dado feita na borda da API.

## Responsabilidade

Validação de regra de negócio — ex.: ADR-008 ("toda operação nasce dentro de uma Estratégia"), ADR-004 ("Estratégia encerrada nunca recebe nova Execução"), ADR-003 (uma Estratégia ativa por Workspace).

## Conteúdo esperado

- Lista de invariantes por ADR, com o serviço responsável por verificar cada um.
- O que acontece quando um invariante é violado — referência ao erro correspondente em `api/errors.md`.

## Relação com os documentos de produto

`DECISIONS.md` (todos os ADRs de regra de domínio); Critérios de aceite das RFCs.

## Invariantes registrados

- **Aceite de convite exige e-mail verificado (F3, Threat Modeling Review; ADR-011).** `aceitarConviteAction` (`apps/web/src/actions/configuracoes.actions.ts`) só chama `ConfiguracoesService.aceitarConvite` — e, portanto, só popula `members.user_id` — depois de confirmar `emailVerified` (derivado de `email_confirmed_at` do Supabase Auth, `apps/web/src/server/auth.ts`). Sem essa checagem, uma conta criada com um e-mail alheio ainda não confirmado poderia aceitar um convite destinado a outra pessoa. Violação → `Error` lançado na própria Server Action, antes de qualquer escrita.

## Dependências

`backend/services.md`.

## O que NÃO pertence a este documento

Validação de formato/tipo de payload recebido pela API — isso é `api/contracts.md` (Zod na borda, CLAUDE.md, Validation).
