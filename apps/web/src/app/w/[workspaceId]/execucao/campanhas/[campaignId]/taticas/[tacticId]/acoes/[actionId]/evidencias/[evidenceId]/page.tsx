import Link from 'next/link';
import { obterEvidenciaAction } from '@/actions/execucao.actions';

interface EvidenciaDetalhePageProps {
  params: Promise<{
    workspaceId: string;
    campaignId: string;
    tacticId: string;
    actionId: string;
    evidenceId: string;
  }>;
}

/** `content` é jsonb/`unknown` — exibido como texto quando string, senão como JSON formatado. */
function renderContent(content: unknown): string {
  return typeof content === 'string' ? content : JSON.stringify(content, null, 2);
}

/**
 * Detalhe de Evidência (RFC-002). Só exibe os próprios campos da Evidência —
 * sem edição nem exclusão, conforme escopo.
 */
export default async function EvidenciaDetalhePage({ params }: EvidenciaDetalhePageProps) {
  const { workspaceId, campaignId, tacticId, actionId, evidenceId } = await params;
  const evidencia = await obterEvidenciaAction(workspaceId, evidenceId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/w/${workspaceId}/execucao/campanhas/${campaignId}/taticas/${tacticId}/acoes/${actionId}/evidencias`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Evidências
        </Link>
        <h1 className="text-2xl font-semibold">Evidência</h1>
      </div>

      <dl className="flex flex-col gap-4 text-sm">
        <div>
          <dt className="font-medium text-muted-foreground">Conteúdo</dt>
          <dd className="mt-1 whitespace-pre-wrap">{renderContent(evidencia.content)}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Registrada em</dt>
          <dd className="mt-1">{evidencia.createdAt.toLocaleDateString('pt-BR')}</dd>
        </div>
      </dl>

      <Link
        href={`/w/${workspaceId}/growth/hipoteses/nova?evidenceId=${evidencia.id}`}
        className="block max-w-xs rounded-md border p-4 text-sm hover:bg-muted/50"
      >
        <span className="font-medium">Registrar Hipótese</span>
        <p className="mt-1 text-muted-foreground">Growth: formar uma Hipótese a partir desta Evidência.</p>
      </Link>
    </div>
  );
}
