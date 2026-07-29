import Link from 'next/link';
import { listarHipotesesAction } from '@/actions/growth.actions';

interface HypothesisListProps {
  workspaceId: string;
  evidenceId?: string;
}

/** Rótulo de apresentação — não é regra de negócio, só tradução do enum já validado pelo Service. */
const STATUS_LABELS: Record<string, string> = {
  registrada: 'Registrada',
  priorizada: 'Priorizada',
  em_teste: 'Em teste',
  validada: 'Validada',
  refutada: 'Refutada',
};

/** Listagem de Hipóteses (RFC-003). Sem "Nova Hipótese" aqui: o registro sempre parte de uma Evidência específica (RFC-003, critério nº1). */
export async function HypothesisList({ workspaceId, evidenceId }: HypothesisListProps) {
  const hipoteses = await listarHipotesesAction(workspaceId, evidenceId, { limit: 50 });

  if (hipoteses.items.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhuma Hipótese registrada ainda.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {hipoteses.items.map((hipotese) => (
        <li key={hipotese.id}>
          <Link
            href={`/w/${workspaceId}/growth/hipoteses/${hipotese.id}`}
            className="block rounded-md border p-4 text-sm hover:bg-muted/50"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="line-clamp-2 font-medium">{hipotese.description}</span>
              <span className="shrink-0 text-muted-foreground">
                {STATUS_LABELS[hipotese.status] ?? hipotese.status}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
