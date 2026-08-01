import Link from 'next/link';
import { STEP_DEPENDENCIES, type StepType } from '@vektor/services';
import { listarEtapasAction } from '@/actions/estrategia.actions';

interface StepListProps {
  workspaceId: string;
  strategyId: string;
}

/**
 * Rótulo de apresentação — não é regra de negócio, só tradução de `StepType`.
 * A ordem de exibição vem de `Object.keys(STEP_DEPENDENCIES)`, que preserva
 * a ordem de inserção do objeto — a mesma ordem da tabela do Marketing
 * Planning Framework em RFC-001 — em vez de duplicar essa ordem aqui.
 */
const STEP_LABELS: Record<StepType, string> = {
  diagnostico: 'Diagnóstico',
  mercado: 'Mercado',
  concorrentes: 'Concorrentes',
  swot: 'SWOT',
  icp: 'ICP',
  personas: 'Personas',
  jornada_cliente: 'Jornada do Cliente',
  funis: 'Funis',
  objetivos: 'Objetivos',
  posicionamento: 'Posicionamento',
  sintese: 'Síntese',
};

const STEP_ORDER = Object.keys(STEP_DEPENDENCIES) as StepType[];

/**
 * Lista as 11 etapas do Marketing Planning Framework (RFC-001), com status
 * e bloqueio visual por dependência (`STEP_DEPENDENCIES`, já existente em
 * `@vektor/services`). O bloqueio aqui é só apresentação — `EstrategiaService.aprovarEtapa`
 * já impõe a ordem de verdade; esta lista nunca decide por conta própria.
 */
export async function StepList({ workspaceId, strategyId }: StepListProps) {
  const etapas = await listarEtapasAction(workspaceId, strategyId);
  const porTipo = new Map(etapas.items.map((etapa) => [etapa.stepType, etapa]));

  return (
    <ul className="flex flex-col gap-2">
      {STEP_ORDER.map((stepType) => {
        const etapa = porTipo.get(stepType);
        const dependencias = STEP_DEPENDENCIES[stepType];
        const dependenciasPendentes = dependencias.filter((dep) => !porTipo.get(dep)?.approvedAt);
        const bloqueada = dependenciasPendentes.length > 0;

        let status = 'Não iniciada';
        if (etapa?.approvedAt) status = 'Aprovada';
        else if (etapa) status = 'Preenchida';

        return (
          <li key={stepType}>
            <Link
              href={`/w/${workspaceId}/estrategia/${stepType}`}
              className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm hover:bg-muted/50"
            >
              <span className="font-medium">{STEP_LABELS[stepType]}</span>
              <span className="text-muted-foreground">
                {status}
                {bloqueada && status !== 'Aprovada' ? ' — aguarda etapas anteriores' : ''}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
