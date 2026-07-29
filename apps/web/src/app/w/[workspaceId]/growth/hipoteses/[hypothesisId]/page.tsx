import Link from 'next/link';
import { buttonVariants } from '@vektor/ui/button';
import { obterHipoteseAction } from '@/actions/growth.actions';
import { ExperimentList } from '@/components/growth/experiment-list';
import { PrioritizeHypothesisButton } from '@/components/growth/prioritize-hypothesis-button';

interface HipoteseDetalhePageProps {
  params: Promise<{ workspaceId: string; hypothesisId: string }>;
}

/** Rótulo de apresentação — não é regra de negócio, só tradução do enum já validado pelo Service. */
const STATUS_LABELS: Record<string, string> = {
  registrada: 'Registrada',
  priorizada: 'Priorizada',
  em_teste: 'Em teste',
  validada: 'Validada',
  refutada: 'Refutada',
};

/**
 * Detalhe de Hipótese (RFC-003/RFC-004). Barra de ações dinâmica: mapeia
 * `hipotese.status` — já validado inteiramente pelo Service — para qual
 * ação de transição oferecer, mesmo padrão de `AcaoDetalhePage`.
 */
export default async function HipoteseDetalhePage({ params }: HipoteseDetalhePageProps) {
  const { workspaceId, hypothesisId } = await params;
  const hipotese = await obterHipoteseAction(workspaceId, hypothesisId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/w/${workspaceId}/growth/hipoteses`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Hipóteses
        </Link>
        <h1 className="text-2xl font-semibold">Hipótese</h1>
      </div>

      <dl className="flex flex-col gap-4 text-sm">
        <div>
          <dt className="font-medium text-muted-foreground">Status</dt>
          <dd className="mt-1">{STATUS_LABELS[hipotese.status] ?? hipotese.status}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Descrição</dt>
          <dd className="mt-1">{hipotese.description}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Registrada em</dt>
          <dd className="mt-1">{hipotese.createdAt.toLocaleDateString('pt-BR')}</dd>
        </div>
      </dl>

      <div className="flex items-center gap-3">
        {hipotese.status === 'registrada' && (
          <PrioritizeHypothesisButton workspaceId={workspaceId} hypothesisId={hypothesisId} />
        )}
        <Link
          href={`/w/${workspaceId}/growth/hipoteses/${hypothesisId}/experimentos/nova`}
          className={buttonVariants({ variant: 'outline' })}
        >
          Propor Experimento
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Experimentos</h2>
        <ExperimentList workspaceId={workspaceId} hypothesisId={hypothesisId} />
      </section>
    </div>
  );
}
