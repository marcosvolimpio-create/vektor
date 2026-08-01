import type { Action } from '@vektor/db';

export interface ActionContextItem {
  id: string;
  name: string;
  status: Action['status'];
  createdAt: Date;
  evidenceCount: number;
  /** Via `Hypothesis.status === 'refutada'` ligada a uma Evidência desta Ação — proxy real mais próxima de "Evidência negativa" que o domínio atual permite (não existe campo de sentimento em `evidences`). */
  hasRefutedHypothesis: boolean;
}

export interface TacticContextItem {
  id: string;
  name: string;
  actions: ActionContextItem[];
}

export interface CampaignContextItem {
  id: string;
  name: string;
  createdAt: Date;
  tactics: TacticContextItem[];
}

export interface ObjectiveContextItem {
  id: string;
  description: string;
  experimentCount: number;
}

/**
 * KPI/indicador não existe em nenhuma tabela do domínio VEKTOR hoje —
 * RFC-007 já registra essa lacuna ("nenhuma fonte nomeia um único exemplo
 * de KPI concreto"). Este tipo existe para que o motor de análise já saiba
 * lidar com KPIs quando essa lacuna for resolvida por uma RFC futura; até
 * lá, `ExecutionContext.kpis` é sempre um array vazio na leitura real.
 */
export interface KpiContextItem {
  nome: string;
  meta: number;
  atual: number;
}

/**
 * Entrada do motor de análise (Sprint 4 — Execução Inteligente). Montado
 * exclusivamente a partir de Repositories já existentes
 * (Strategy/Objectives/Campaigns/Tactics/Actions/Evidences/Experiments) —
 * nenhuma tabela nova é lida para compor isto.
 */
export interface ExecutionContext {
  strategy: {
    id: string;
    status: string;
    createdAt: Date;
  };
  objectives: ObjectiveContextItem[];
  campaigns: CampaignContextItem[];
  /** Sempre `[]` na leitura real hoje — ver comentário em `KpiContextItem`. */
  kpis: KpiContextItem[];
  generatedAt: Date;
}
