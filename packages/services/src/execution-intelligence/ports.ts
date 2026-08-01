import type { ExecutionContext } from './execution-context';
import type { RecommendationDraft } from './recommendation';

/**
 * Porta (Sprint 4 — Execução Inteligente) para o "cérebro" que transforma um
 * `ExecutionContext` em recomendações. Hoje só existe `FakeExecutionAdvisor`
 * (regras determinísticas, sem chamada externa) — um provedor real de IA
 * (OpenAI/Claude/Gemini) implementa esta mesma interface depois, sem exigir
 * nenhuma mudança em `ExecutionIntelligenceService` nem nas Server Actions
 * que o consomem. Mesmo espírito de `EstrategiaEvolucaoPort`
 * (`packages/services/src/shared/ports.ts`): o Service depende só da
 * capacidade, nunca da implementação concreta.
 */
export interface ExecutionAdvisorAI {
  gerarRecomendacoes(context: ExecutionContext): RecommendationDraft[];
}
