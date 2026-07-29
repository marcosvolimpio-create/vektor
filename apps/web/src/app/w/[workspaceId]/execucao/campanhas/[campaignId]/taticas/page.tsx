import Link from 'next/link';
import { buttonVariants } from '@vektor/ui/button';
import { listarTaticasAction } from '@/actions/execucao.actions';

interface TaticasPageProps {
  params: Promise<{ workspaceId: string; campaignId: string }>;
}

/** Listagem de Táticas de uma Campanha (RFC-002) — mesmo padrão da listagem de Campanhas. */
export default async function TaticasPage({ params }: TaticasPageProps) {
  const { workspaceId, campaignId } = await params;
  const taticas = await listarTaticasAction(workspaceId, campaignId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Táticas</h1>
        <Link
          href={`/w/${workspaceId}/execucao/campanhas/${campaignId}/taticas/nova`}
          className={buttonVariants()}
        >
          Criar Tática
        </Link>
      </div>

      {taticas.items.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma Tática criada ainda para esta Campanha.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {taticas.items.map((tatica) => (
            <li key={tatica.id}>
              <Link
                href={`/w/${workspaceId}/execucao/campanhas/${campaignId}/taticas/${tatica.id}`}
                className="block rounded-md border p-4 text-sm hover:bg-muted/50"
              >
                <span className="font-medium">{tatica.name}</span>
                {tatica.description && <p className="mt-1 text-muted-foreground">{tatica.description}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
