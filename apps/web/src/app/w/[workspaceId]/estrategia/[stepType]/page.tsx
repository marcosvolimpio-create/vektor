import Link from 'next/link';
import { notFound } from 'next/navigation';
import { STEP_DEPENDENCIES, type StepType } from '@vektor/services';
import { obterEstrategiaAtivaAction, listarEtapasAction } from '@/actions/estrategia.actions';
import { ApproveStepButton } from '@/components/estrategia/approve-step-button';
import { ObjectiveForm } from '@/components/estrategia/objective-form';
import { ObjectiveList } from '@/components/estrategia/objective-list';
import { StepContentForm } from '@/components/estrategia/step-content-form';

interface EtapaPageProps {
  params: Promise<{ workspaceId: string; stepType: string }>;
}

/** Rótulo de apresentação — mesmo mapa de `step-list.tsx`, duplicado por arquivo (convenção já aceita no projeto). */
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

function isStepType(value: string): value is StepType {
  return value in STEP_DEPENDENCIES;
}

/**
 * Editor de uma etapa do Marketing Planning Framework (RFC-001, RFC-009).
 * `stepType` é validado contra os 11 valores reais de `STEP_DEPENDENCIES`
 * (já exportado por `@vektor/services`) — qualquer outro valor cai em 404,
 * nunca renderiza um formulário para uma etapa inventada.
 *
 * Quando `stepType === 'objetivos'`, exibe também os Objetivos estruturados
 * (`strategy_objectives`, RFC-003) como seção complementar desta mesma
 * página — decisão registrada em RFC-009 para evitar colisão de rota com
 * `[stepType]`.
 */
export default async function EtapaPage({ params }: EtapaPageProps) {
  const { workspaceId, stepType: stepTypeParam } = await params;

  if (!isStepType(stepTypeParam)) {
    notFound();
  }
  const stepType = stepTypeParam;

  const estrategiaAtiva = await obterEstrategiaAtivaAction(workspaceId);
  if (!estrategiaAtiva) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href={`/w/${workspaceId}/estrategia`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Estratégia
        </Link>
        <p className="text-sm text-muted-foreground">Nenhuma Estratégia ativa neste Workspace.</p>
      </div>
    );
  }

  const etapas = await listarEtapasAction(workspaceId, estrategiaAtiva.id);
  const etapaAtual = etapas.items.find((etapa) => etapa.stepType === stepType);

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-1">
        <Link
          href={`/w/${workspaceId}/estrategia`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Estratégia
        </Link>
        <h1 className="text-2xl font-semibold">{STEP_LABELS[stepType]}</h1>
        {etapaAtual?.approvedAt && (
          <p className="text-sm text-muted-foreground">
            Aprovada em {etapaAtual.approvedAt.toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>

      <StepContentForm
        workspaceId={workspaceId}
        strategyId={estrategiaAtiva.id}
        stepType={stepType}
        initialContent={etapaAtual?.content}
      />

      <ApproveStepButton workspaceId={workspaceId} strategyId={estrategiaAtiva.id} stepType={stepType} />

      {stepType === 'objetivos' && (
        <section className="flex flex-col gap-3 border-t pt-6">
          <h2 className="text-lg font-medium">Objetivos estruturados</h2>
          <p className="text-sm text-muted-foreground">
            Usados por Growth para justificar Experimentos (dupla amarração).
          </p>
          <ObjectiveForm workspaceId={workspaceId} strategyId={estrategiaAtiva.id} />
          <ObjectiveList workspaceId={workspaceId} strategyId={estrategiaAtiva.id} />
        </section>
      )}
    </div>
  );
}
