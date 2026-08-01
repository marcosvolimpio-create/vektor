# VEKTOR — Sprint Log

> Registro informal de progresso por Sprint de implementação. Não substitui `docs/implementation-plan.md` (fases formais, ligadas a RFC/ADR) — é só um checklist de execução, criado a partir da Sprint 4 (nenhum arquivo equivalente existia antes).

## Sprint 1 — RFC-004 a RFC-009 (Formulação, Aprendizado, Biblioteca, Relatórios, Configurações, Estratégia)
**Status:** ✅ Concluída
Commit: `8d8f84e`

## Sprint 2 — Fluxo de autenticação e onboarding
**Status:** ✅ Concluída
Commit: `753ae04`
Login, Cadastro, criação do primeiro Workspace, aceite de convite, redirecionamento automático para `/w/{workspaceId}`.

## Sprint 3 — CRUD de Estratégia
**Status:** ✅ Concluída (sem alteração de código)
O fluxo já existia (`iniciarFormulacaoAction` + UI de 11 etapas, RFC-001/RFC-009) — auditoria confirmou que o botão "Criar Estratégia" já funcionava; nenhuma mudança foi necessária.

## Sprint 4 — Execução Inteligente
**Status:** ✅ Concluída
Commit: `28f8351`

- `ExecutionIntelligenceService`: análise, geração de recomendações, persistência, aprovação e descarte.
- Entidade nova `execution_recommendations` (exceção explícita aprovada — não altera Campaigns/Tactics/Actions/Evidence/Objectives/Experiments).
- Porta `ExecutionAdvisorAI` + `FakeExecutionAdvisor` (regras determinísticas; nenhum provedor de IA externo integrado ainda).
- Painel de Recomendações em `/w/[workspaceId]/execucao/recomendacoes`.
- Primeira suíte de testes automatizados do projeto (Vitest, 15 testes).
- Smoke test end-to-end validado contra Supabase/Postgres reais.

**Pendências conhecidas, não resolvidas nesta Sprint:**
- Handoff automático Estratégia → Execução continua não implementado.
- `kpi_abaixo_meta` não dispara contra dado real (nenhum KPI modelado no domínio — RFC-007).
- RLS ausente em todas as tabelas, incluindo a nova (gap P0 já registrado em auditoria anterior).
