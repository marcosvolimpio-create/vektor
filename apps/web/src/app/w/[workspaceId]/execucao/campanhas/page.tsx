import Link from 'next/link';
import { buttonVariants } from '@vektor/ui/button';
import { obterEstrategiaAtivaAction } from '@/actions/estrategia.actions';
import { listarCampanhasAction } from '@/actions/execucao.actions';

interface CampanhasPageProps {
  params: Promise<{ workspaceId: string }>;
}

/**
 * Listagem completa de Campanhas (RFC-002). Mesma convenção da página
 * inicial de Execução: `workspaceId` vem da URL, a Estratégia ativa é
 * resolvida a cada carregamento via `obterEstrategiaAtivaAction`
 * (`docs/implementation/frontend/routing.md`) — nunca lida da URL.
 */
export default async function CampanhasPage({ params }: CampanhasPageProps) {
  const { workspaceId } = await params;
  const estrategiaAtiva = await obterEstrategiaAtivaAction(workspaceId);

  if (!estrategiaAtiva) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Campanhas</h1>
        <p className="text-sm text-muted-foreground">Nenhuma Estratégia ativa neste Workspace.</p>
      </div>
    );
  }

  const campanhas = await listarCampanhasAction(workspaceId, estrategiaAtiva.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Campanhas</h1>
        <Link href={`/w/${workspaceId}/execucao/campanhas/nova`} className={buttonVariants()}>
          Criar Campanha
        </Link>
      </div>

      {campanhas.items.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma Campanha criada ainda para esta Estratégia.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {campanhas.items.map((campanha) => (
            <li key={campanha.id}>
              <Link
                href={`/w/${workspaceId}/execucao/campanhas/${campanha.id}`}
                className="block rounded-md border p-4 text-sm hover:bg-muted/50"
              >
                <span className="font-medium">{campanha.name}</span>
                {campanha.description && (
                  <p className="mt-1 text-muted-foreground">{campanha.description}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
