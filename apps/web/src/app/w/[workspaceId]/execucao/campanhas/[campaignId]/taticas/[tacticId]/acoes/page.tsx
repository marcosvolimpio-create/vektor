import Link from 'next/link';
import { buttonVariants } from '@vektor/ui/button';
import { listarAcoesAction } from '@/actions/execucao.actions';

interface AcoesPageProps {
  params: Promise<{ workspaceId: string; campaignId: string; tacticId: string }>;
}

/** Listagem de Ações de uma Tática (RFC-002) — mesmo padrão da listagem de Táticas/Campanhas. */
export default async function AcoesPage({ params }: AcoesPageProps) {
  const { workspaceId, campaignId, tacticId } = await params;
  const acoes = await listarAcoesAction(workspaceId, tacticId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ações</h1>
        <Link
          href={`/w/${workspaceId}/execucao/campanhas/${campaignId}/taticas/${tacticId}/acoes/nova`}
          className={buttonVariants()}
        >
          Criar Ação
        </Link>
      </div>

      {acoes.items.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma Ação criada ainda para esta Tática.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {acoes.items.map((acao) => (
            <li key={acao.id}>
              <Link
                href={`/w/${workspaceId}/execucao/campanhas/${campaignId}/taticas/${tacticId}/acoes/${acao.id}`}
                className="block rounded-md border p-4 text-sm hover:bg-muted/50"
              >
                <span className="font-medium">{acao.name}</span>
                {acao.description && <p className="mt-1 text-muted-foreground">{acao.description}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
