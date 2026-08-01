import Link from 'next/link';
import { listarAcoesAction, listarCampanhasAction } from '@/actions/execucao.actions';
import { listarAprendizadosAction } from '@/actions/aprendizado.actions';

interface BibliotecaPageProps {
  params: Promise<{ workspaceId: string }>;
}

/** Rótulo de apresentação — não é regra de negócio, só tradução do enum já validado pelo Service. */
const ACTION_STATUS_LABELS: Record<string, string> = {
  proposta: 'Proposta',
  aprovada: 'Aprovada',
  em_execucao: 'Em execução',
  concluida: 'Concluída',
  publicada: 'Publicada',
};

/** `content` é jsonb/`unknown` — mesma apresentação usada nas listagens de Growth/Aprendizado. */
function previewContent(content: unknown): string {
  return typeof content === 'string' ? content : JSON.stringify(content);
}

/**
 * Biblioteca (RFC-006) — Contexto Global: acumula e disponibiliza para
 * consulta o que Execução (Campanha, Ação) e Aprendizado já produziram, de
 * todas as Estratégias do Workspace, passadas e presente — nunca escopado
 * pela Estratégia ativa (diferente de `execucao/campanhas` e
 * `execucao/.../acoes`, que sempre filtram por ela).
 *
 * Nenhum Service novo: Biblioteca não tem domínio próprio (mesmo paralelo
 * estrutural de Dashboard, ADR-001) — esta página só compõe três Server
 * Actions já existentes (`listarCampanhasAction`/`listarAcoesAction`/
 * `listarAprendizadosAction`), chamadas sem `strategyId`/`tacticId`.
 *
 * Ações são exibidas sem link de detalhe: a rota de detalhe de Ação exige
 * `campaignId`/`tacticId` na URL, que `Action` não carrega diretamente
 * (só `tacticId`) — resolver isso exigiria um padrão N+1 por item (já
 * aceito em `DashboardActions`, mas lá bem limitado a 5 itens). Biblioteca
 * lista até 50 por seção; replicar esse padrão nessa escala não está no
 * escopo aprovado desta implementação — texto simples evita introduzir
 * esse custo sem necessidade.
 */
export default async function BibliotecaPage({ params }: BibliotecaPageProps) {
  const { workspaceId } = await params;

  const [campanhas, acoes, aprendizados] = await Promise.all([
    listarCampanhasAction(workspaceId, undefined, { limit: 50 }),
    listarAcoesAction(workspaceId, undefined, { limit: 50 }),
    listarAprendizadosAction(workspaceId, undefined, { limit: 50 }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Biblioteca</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Campanhas</h2>
        {campanhas.items.length === 0 ? (
          <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhuma Campanha registrada ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {campanhas.items.map((campanha) => (
              <li key={campanha.id}>
                <Link
                  href={`/w/${workspaceId}/execucao/campanhas/${campanha.id}`}
                  className="block rounded-md border p-3 text-sm hover:bg-muted/50"
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
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Ações</h2>
        {acoes.items.length === 0 ? (
          <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhuma Ação registrada ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {acoes.items.map((acao) => (
              <li key={acao.id} className="rounded-md border p-3 text-sm">
                <span className="font-medium">{acao.name}</span>
                <span className="ml-2 text-muted-foreground">
                  {ACTION_STATUS_LABELS[acao.status] ?? acao.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Aprendizado</h2>
        {aprendizados.items.length === 0 ? (
          <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhum Aprendizado registrado ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {aprendizados.items.map((aprendizado) => (
              <li key={aprendizado.id}>
                <Link
                  href={`/w/${workspaceId}/aprendizado/${aprendizado.id}`}
                  className="block rounded-md border p-3 text-sm hover:bg-muted/50"
                >
                  <span className="line-clamp-2">{previewContent(aprendizado.content)}</span>
                  <p className="mt-1 text-muted-foreground">
                    {aprendizado.createdAt.toLocaleDateString('pt-BR')}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
