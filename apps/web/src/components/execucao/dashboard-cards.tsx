import { listarAcoesAction, listarCampanhasAction, listarEvidenciasAction, listarTaticasAction } from '@/actions/execucao.actions';

interface DashboardCardsProps {
  workspaceId: string;
}

/**
 * Indicadores do Workspace inteiro (Lacuna 3: id de pai opcional →
 * `findByWorkspace`). `limit: 1` porque só o campo `total` do
 * `PaginatedResult` é usado — `total` vem de uma contagem separada no
 * Repository, independente do `limit`.
 */
export async function DashboardCards({ workspaceId }: DashboardCardsProps) {
  const [campanhas, taticas, acoes, evidencias] = await Promise.all([
    listarCampanhasAction(workspaceId, undefined, { limit: 1 }),
    listarTaticasAction(workspaceId, undefined, { limit: 1 }),
    listarAcoesAction(workspaceId, undefined, { limit: 1 }),
    listarEvidenciasAction(workspaceId, undefined, { limit: 1 }),
  ]);

  const cards = [
    { label: 'Campanhas', total: campanhas.total },
    { label: 'Táticas', total: taticas.total },
    { label: 'Ações', total: acoes.total },
    { label: 'Evidências', total: evidencias.total },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-md border p-4">
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="text-2xl font-semibold">{card.total}</p>
        </div>
      ))}
    </div>
  );
}
