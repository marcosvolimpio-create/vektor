import Link from 'next/link';
import { listarCampanhasAction } from '@/actions/execucao.actions';
import { DashboardEmptyState } from './dashboard-empty-state';

interface DashboardCampaignsProps {
  workspaceId: string;
}

/** As 5 Campanhas mais recentes do Workspace (Lacuna 2: `findByWorkspace` ordenado por `createdAt desc`). */
export async function DashboardCampaigns({ workspaceId }: DashboardCampaignsProps) {
  const campanhas = await listarCampanhasAction(workspaceId, undefined, { limit: 5 });

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Últimas Campanhas</h2>
        <Link
          href={`/w/${workspaceId}/execucao/campanhas`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Ver todas
        </Link>
      </div>

      {campanhas.items.length === 0 ? (
        <DashboardEmptyState message="Nenhuma Campanha criada ainda." />
      ) : (
        <ul className="flex flex-col gap-2">
          {campanhas.items.map((campanha) => (
            <li key={campanha.id}>
              <Link
                href={`/w/${workspaceId}/execucao/campanhas/${campanha.id}`}
                className="block rounded-md border p-3 text-sm hover:bg-muted/50"
              >
                {campanha.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
