import type { ExecutionRecommendation } from '@vektor/db';

export type RecommendationType = ExecutionRecommendation['type'];
export type RecommendationPriority = ExecutionRecommendation['priority'];
export type RecommendationStatus = ExecutionRecommendation['status'];

/** Saída do motor de IA antes de persistir — sem `id`/`status`/timestamps, que só existem depois de gravada. */
export interface RecommendationDraft {
  type: RecommendationType;
  priority: RecommendationPriority;
  justification: string;
  context: Record<string, unknown>;
  suggestedAction: string;
  /** Chave determinística usada para evitar recomendação duplicada enquanto `status = 'pendente'` (ex.: `acao_atrasada:{actionId}`). */
  dedupeKey: string;
}

export type Recommendation = ExecutionRecommendation;
