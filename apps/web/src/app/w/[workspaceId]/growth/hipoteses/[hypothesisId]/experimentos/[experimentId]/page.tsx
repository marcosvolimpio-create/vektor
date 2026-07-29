import Link from 'next/link';
import { obterExperimentoAction } from '@/actions/growth.actions';
import { ApproveExperimentButton } from '@/components/growth/approve-experiment-button';
import { ConcludeExperimentForm } from '@/components/growth/conclude-experiment-form';
import { StartExperimentButton } from '@/components/growth/start-experiment-button';

interface ExperimentoDetalhePageProps {
  params: Promise<{ workspaceId: string; hypothesisId: string; experimentId: string }>;
}

/** Rótulo de apresentação — não é regra de negócio, só tradução do enum já validado pelo Service. */
const STATUS_LABELS: Record<string, string> = {
  proposto: 'Proposto',
  aprovado: 'Aprovado',
  em_execucao: 'Em execução',
  concluido: 'Concluído',
};

/**
 * Detalhe de Experimento (RFC-003/RFC-004). Barra de ações dinâmica: mapeia
 * `experimento.status` — já validado inteiramente pelo Service — para qual
 * dos três componentes de transição renderizar, mesmo padrão de
 * `AcaoDetalhePage`. `aprovado`/`concluido` alteram também a Hipótese
 * associada (RFC-003/004); esta página não precisa saber disso — só exibe o
 * Experimento.
 */
export default async function ExperimentoDetalhePage({ params }: ExperimentoDetalhePageProps) {
  const { workspaceId, hypothesisId, experimentId } = await params;
  const experimento = await obterExperimentoAction(workspaceId, experimentId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/w/${workspaceId}/growth/hipoteses/${hypothesisId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Hipótese
        </Link>
        <h1 className="text-2xl font-semibold">Experimento</h1>
      </div>

      <dl className="flex flex-col gap-4 text-sm">
        <div>
          <dt className="font-medium text-muted-foreground">Status</dt>
          <dd className="mt-1">{STATUS_LABELS[experimento.status] ?? experimento.status}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Proposto em</dt>
          <dd className="mt-1">{experimento.createdAt.toLocaleDateString('pt-BR')}</dd>
        </div>
        {experimento.approvedAt && (
          <div>
            <dt className="font-medium text-muted-foreground">Aprovado em</dt>
            <dd className="mt-1">{experimento.approvedAt.toLocaleDateString('pt-BR')}</dd>
          </div>
        )}
      </dl>

      <div>
        {experimento.status === 'proposto' && (
          <ApproveExperimentButton workspaceId={workspaceId} experimentId={experimentId} />
        )}
        {experimento.status === 'aprovado' && (
          <StartExperimentButton workspaceId={workspaceId} experimentId={experimentId} />
        )}
        {experimento.status === 'em_execucao' && (
          <ConcludeExperimentForm workspaceId={workspaceId} experimentId={experimentId} />
        )}
        {experimento.status === 'concluido' && (
          <p className="text-sm text-muted-foreground">Experimento concluído.</p>
        )}
      </div>
    </div>
  );
}
