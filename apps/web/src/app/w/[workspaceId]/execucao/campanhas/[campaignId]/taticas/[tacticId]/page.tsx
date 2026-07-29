import Link from 'next/link';
import { obterTaticaAction } from '@/actions/execucao.actions';

interface TaticaDetalhePageProps {
  params: Promise<{ workspaceId: string; campaignId: string; tacticId: string }>;
}

/**
 * Detalhe de Tática (RFC-002). Só exibe os próprios campos da Tática — não
 * lista Ações inline: a listagem completa vive em
 * `/taticas/[tacticId]/acoes` (mesmo padrão de Campanha em relação a
 * Táticas, Módulo 5), evitando duplicar a mesma lógica de listagem em dois
 * lugares.
 */
export default async function TaticaDetalhePage({ params }: TaticaDetalhePageProps) {
  const { workspaceId, campaignId, tacticId } = await params;
  const tatica = await obterTaticaAction(workspaceId, tacticId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/w/${workspaceId}/execucao/campanhas/${campaignId}/taticas`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Táticas
        </Link>
        <h1 className="text-2xl font-semibold">{tatica.name}</h1>
      </div>

      <dl className="flex flex-col gap-4 text-sm">
        <div>
          <dt className="font-medium text-muted-foreground">Descrição</dt>
          <dd className="mt-1">{tatica.description ?? 'Sem descrição.'}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Criada em</dt>
          <dd className="mt-1">{tatica.createdAt.toLocaleDateString('pt-BR')}</dd>
        </div>
      </dl>

      <Link
        href={`/w/${workspaceId}/execucao/campanhas/${campaignId}/taticas/${tacticId}/acoes`}
        className="block max-w-xs rounded-md border p-4 text-sm hover:bg-muted/50"
      >
        <span className="font-medium">Ações</span>
        <p className="mt-1 text-muted-foreground">Ver e criar Ações desta Tática.</p>
      </Link>
    </div>
  );
}
