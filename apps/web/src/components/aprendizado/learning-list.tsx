import Link from 'next/link';
import { listarAprendizadosAction } from '@/actions/aprendizado.actions';

interface LearningListProps {
  workspaceId: string;
  evidenceId?: string;
}

/** `content` é jsonb/`unknown` — mesma apresentação usada nas listagens de Execução/Growth. */
function previewContent(content: unknown): string {
  return typeof content === 'string' ? content : JSON.stringify(content);
}

/** Listagem de Aprendizado (RFC-005). */
export async function LearningList({ workspaceId, evidenceId }: LearningListProps) {
  const aprendizados = await listarAprendizadosAction(workspaceId, evidenceId, { limit: 50 });

  if (aprendizados.items.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhum Aprendizado registrado ainda.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {aprendizados.items.map((aprendizado) => (
        <li key={aprendizado.id}>
          <Link
            href={`/w/${workspaceId}/aprendizado/${aprendizado.id}`}
            className="block rounded-md border p-4 text-sm hover:bg-muted/50"
          >
            <span className="line-clamp-2">{previewContent(aprendizado.content)}</span>
            <p className="mt-1 text-muted-foreground">{aprendizado.createdAt.toLocaleDateString('pt-BR')}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
