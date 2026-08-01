import Link from 'next/link';
import { obterAprendizadoAction } from '@/actions/aprendizado.actions';

interface AprendizadoDetalhePageProps {
  params: Promise<{ workspaceId: string; learningId: string }>;
}

/** `content` é jsonb/`unknown` — exibido como texto quando string, senão como JSON formatado. */
function renderContent(content: unknown): string {
  return typeof content === 'string' ? content : JSON.stringify(content, null, 2);
}

/** Detalhe de Aprendizado (RFC-005). Sem edição nem exclusão — tabela append-only, critério nº2. */
export default async function AprendizadoDetalhePage({ params }: AprendizadoDetalhePageProps) {
  const { workspaceId, learningId } = await params;
  const aprendizado = await obterAprendizadoAction(workspaceId, learningId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/w/${workspaceId}/aprendizado`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Aprendizado
        </Link>
        <h1 className="text-2xl font-semibold">Aprendizado</h1>
      </div>

      <dl className="flex flex-col gap-4 text-sm">
        <div>
          <dt className="font-medium text-muted-foreground">Conteúdo</dt>
          <dd className="mt-1 whitespace-pre-wrap">{renderContent(aprendizado.content)}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Registrado em</dt>
          <dd className="mt-1">{aprendizado.createdAt.toLocaleDateString('pt-BR')}</dd>
        </div>
      </dl>
    </div>
  );
}
