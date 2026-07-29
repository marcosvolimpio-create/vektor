import type { StrategyStep } from '@vektor/db';

export type StepType = StrategyStep['stepType'];

/**
 * Ordem de dependência das 11 etapas do Marketing Planning Framework
 * (RFC-001, tabela em "Marketing Planning Framework"; idêntica a
 * `product-blueprint.md`, Cap. 5). Cada etapa só pode ser **aprovada**
 * depois que todas as etapas listadas aqui já estiverem aprovadas
 * (RFC-001, critério de aceite nº2) — preencher conteúdo (rascunho) não
 * exige essa ordem, só a aprovação exige.
 */
export const STEP_DEPENDENCIES: Readonly<Record<StepType, readonly StepType[]>> = {
  diagnostico: [],
  mercado: ['diagnostico'],
  concorrentes: ['mercado'],
  swot: ['diagnostico', 'mercado', 'concorrentes'],
  icp: ['swot'],
  personas: ['icp'],
  jornada_cliente: ['personas'],
  funis: ['jornada_cliente'],
  objetivos: ['swot', 'icp'],
  posicionamento: ['concorrentes', 'icp', 'objetivos'],
  sintese: [
    'diagnostico',
    'mercado',
    'concorrentes',
    'swot',
    'icp',
    'personas',
    'jornada_cliente',
    'funis',
    'objetivos',
    'posicionamento',
  ],
};
