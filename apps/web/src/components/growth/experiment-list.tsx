import Link from 'next/link';
import { listarExperimentosAction } from '@/actions/growth.actions';

interface ExperimentListProps {
  workspaceId: string;
  hypothesisId: string;
}

/** Rótulo de apresentação — não é regra de negócio, só tradução do enum já validado pelo Service. */
const STATUS_LABELS: Record<string, string> = {
  proposto: 'Proposto',
  aprovado: 'Aprovado',
  em_execucao: 'Em execução',
  concluido: 'Concluído',
};

/** Listagem de Experimentos de uma Hipótese (RFC-003). */
export async function ExperimentList({ workspaceId, hypothesisId }: ExperimentListProps) {
  const experimentos = await listarExperimentosAction(workspaceId, hypothesisId, { limit: 50 });

  if (experimentos.items.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhum Experimento proposto para esta Hipótese ainda.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {experimentos.items.map((experimento) => (
        <li key={experimento.id}>
          <Link
            href={`/w/${workspaceId}/growth/hipoteses/${hypothesisId}/experimentos/${experimento.id}`}
            className="block rounded-md border p-4 text-sm hover:bg-muted/50"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">Experimento</span>
              <span className="shrink-0 text-muted-foreground">
                {STATUS_LABELS[experimento.status] ?? experimento.status}
              </span>
            </div>
            <p className="mt-1 text-muted-foreground">
              {experimento.createdAt.toLocaleDateString('pt-BR')}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
