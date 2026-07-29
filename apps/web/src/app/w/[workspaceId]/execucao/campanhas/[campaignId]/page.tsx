import Link from 'next/link';
import { obterCampanhaAction } from '@/actions/execucao.actions';

interface CampanhaDetalhePageProps {
  params: Promise<{ workspaceId: string; campaignId: string }>;
}

/**
 * Detalhe de Campanha (RFC-002). Só exibe os próprios campos da Campanha —
 * não lista Táticas inline: a listagem completa vive em
 * `/execucao/campanhas/[campaignId]/taticas` (mesmo padrão da página inicial
 * de Execução em relação a Campanhas, Módulo 4), evitando duplicar a mesma
 * lógica de listagem em dois lugares. Ações pertencem a um módulo posterior
 * desta Sprint, fora do escopo deste Módulo.
 */
export default async function CampanhaDetalhePage({ params }: CampanhaDetalhePageProps) {
  const { workspaceId, campaignId } = await params;
  const campanha = await obterCampanhaAction(workspaceId, campaignId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/w/${workspaceId}/execucao/campanhas`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Campanhas
        </Link>
        <h1 className="text-2xl font-semibold">{campanha.name}</h1>
      </div>

      <dl className="flex flex-col gap-4 text-sm">
        <div>
          <dt className="font-medium text-muted-foreground">Descrição</dt>
          <dd className="mt-1">{campanha.description ?? 'Sem descrição.'}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Criada em</dt>
          <dd className="mt-1">{campanha.createdAt.toLocaleDateString('pt-BR')}</dd>
        </div>
      </dl>

      <Link
        href={`/w/${workspaceId}/execucao/campanhas/${campaignId}/taticas`}
        className="block max-w-xs rounded-md border p-4 text-sm hover:bg-muted/50"
      >
        <span className="font-medium">Táticas</span>
        <p className="mt-1 text-muted-foreground">Ver e criar Táticas desta Campanha.</p>
      </Link>
    </div>
  );
}
