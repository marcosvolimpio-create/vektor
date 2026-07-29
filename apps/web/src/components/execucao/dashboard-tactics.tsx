import Link from 'next/link';
import { listarTaticasAction } from '@/actions/execucao.actions';
import { DashboardEmptyState } from './dashboard-empty-state';

interface DashboardTacticsProps {
  workspaceId: string;
}

/**
 * As 5 Táticas mais recentes do Workspace. Sem "Ver todas": não existe uma
 * listagem de Táticas do Workspace inteiro na UI — a única listagem
 * construída (Módulo 5) é aninhada sob uma Campanha específica
 * (`/campanhas/[campaignId]/taticas`). Ver decisão no relatório do módulo.
 */
export async function DashboardTactics({ workspaceId }: DashboardTacticsProps) {
  const taticas = await listarTaticasAction(workspaceId, undefined, { limit: 5 });

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Últimas Táticas</h2>

      {taticas.items.length === 0 ? (
        <DashboardEmptyState message="Nenhuma Tática criada ainda." />
      ) : (
        <ul className="flex flex-col gap-2">
          {taticas.items.map((tatica) => (
            <li key={tatica.id}>
              <Link
                href={`/w/${workspaceId}/execucao/campanhas/${tatica.campaignId}/taticas/${tatica.id}`}
                className="block rounded-md border p-3 text-sm hover:bg-muted/50"
              >
                {tatica.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
