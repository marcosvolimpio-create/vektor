import Link from 'next/link';
import { buttonVariants } from '@vektor/ui/button';
import { listarEvidenciasAction } from '@/actions/execucao.actions';

interface EvidenciasPageProps {
  params: Promise<{ workspaceId: string; campaignId: string; tacticId: string; actionId: string }>;
}

/** Mesma lógica de apresentação usada no detalhe: `content` é jsonb/`unknown`. */
function previewContent(content: unknown): string {
  return typeof content === 'string' ? content : JSON.stringify(content);
}

/** Listagem de Evidências de uma Ação (RFC-002) — mesmo padrão da listagem de Ações/Táticas/Campanhas. */
export default async function EvidenciasPage({ params }: EvidenciasPageProps) {
  const { workspaceId, campaignId, tacticId, actionId } = await params;
  const evidencias = await listarEvidenciasAction(workspaceId, actionId);

  const basePath = `/w/${workspaceId}/execucao/campanhas/${campaignId}/taticas/${tacticId}/acoes/${actionId}/evidencias`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Evidências</h1>
        <Link href={`${basePath}/nova`} className={buttonVariants()}>
          Registrar Evidência
        </Link>
      </div>

      {evidencias.items.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma Evidência registrada ainda para esta Ação.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {evidencias.items.map((evidencia) => (
            <li key={evidencia.id}>
              <Link
                href={`${basePath}/${evidencia.id}`}
                className="block rounded-md border p-4 text-sm hover:bg-muted/50"
              >
                <span className="line-clamp-2">{previewContent(evidencia.content)}</span>
                <p className="mt-1 text-muted-foreground">{evidencia.createdAt.toLocaleDateString('pt-BR')}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
