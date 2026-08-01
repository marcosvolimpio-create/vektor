import { listarObjetivosAction } from '@/actions/estrategia.actions';

interface ObjectiveListProps {
  workspaceId: string;
  strategyId: string;
}

/**
 * Objetivos estruturados (`strategy_objectives`, RFC-003) — seção
 * complementar da etapa "objetivos", não uma rota própria (ver "Revisão
 * crítica" de RFC-009). Consumidos por `GrowthService.proporExperimento`
 * na dupla amarração; aqui só listados, sem nenhuma lógica adicional.
 */
export async function ObjectiveList({ workspaceId, strategyId }: ObjectiveListProps) {
  const objetivos = await listarObjetivosAction(workspaceId, strategyId);

  if (objetivos.items.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
        Nenhum Objetivo estruturado ainda.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {objetivos.items.map((objetivo) => (
        <li key={objetivo.id} className="rounded-md border p-3 text-sm">
          {objetivo.description}
        </li>
      ))}
    </ul>
  );
}
