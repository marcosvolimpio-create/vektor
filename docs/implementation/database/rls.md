# Database — Row Level Security

> Documentação de engenharia. Não substitui nem redefine nenhuma RFC ou decisão de produto — apenas traduz a especificação já aprovada em arquitetura técnica.

## Objetivo

Documentar como o isolamento por Workspace (`architecture/domain.md`: "Workspace: o limite de tenant") é garantido em nível de banco, via Row Level Security do Supabase (CLAUDE.md, Technology Stack → Database).

## Responsabilidade

Uma política de RLS por tabela, garantindo que nenhuma linha de um Workspace seja visível a outro — reforço em profundidade (defense-in-depth) da mesma regra já exigida em nível de aplicação (`backend/repositories.md`).

## Conteúdo esperado

- Política por tabela, identificando a coluna que carrega o `workspace_id`.
- O papel de Membro na política de acesso — ✅ ratificado por ADR-011 (`DECISIONS.md`): toda política pode nomear `members` como sujeito de autenticação com confiança. Operações sensíveis (convite, remoção, mudança de `role`) exigem adicionalmente `role = 'admin'` (ADR-012), checado na camada Service (`backend/validation.md`), não pela política de RLS em si — ver `database/rls-policies.md`, "Por que RLS não substitui `backend/validation.md`".
- Casos de exceção — nenhum previsto pelas fontes de produto hoje.

## Relação com os documentos de produto

`architecture/domain.md` (Workspace como limite de tenant); `architecture/navigation.md` (Contexto Global nunca cruza Workspace — a mesma inferência que RFC-005 já usa para os limites de Aprendizado).

## Dependências

✅ Bloqueador 1 (Membro) resolvido (ADR-011) — toda política já pode nomear papéis; `database/schema.md`.

## O que NÃO pertence a este documento

Regras de negócio como "Estratégia encerrada não recebe nova Ação" (ADR-004) — isso é invariante de domínio, não isolamento de tenant, e pertence a `backend/validation.md`.
