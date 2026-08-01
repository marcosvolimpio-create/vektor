import { listarAprendizadosAction } from '@/actions/aprendizado.actions';
import { listarEstrategiasAction } from '@/actions/estrategia.actions';

interface RelatoriosHistoricoPageProps {
  params: Promise<{ workspaceId: string }>;
}

/** Rótulo de apresentação — não é regra de negócio, só tradução do enum já validado pelo Service. */
const STRATEGY_STATUS_LABELS: Record<string, string> = {
  ativa: 'Ativa',
  encerrada: 'Encerrada',
};

/** `content` é jsonb/`unknown` — mesma apresentação usada em Growth/Aprendizado/Biblioteca. */
function previewContent(content: unknown): string {
  return typeof content === 'string' ? content : JSON.stringify(content);
}

/**
 * Relatórios — visão histórica do Workspace (RFC-007, ADR-005). Contexto
 * Global: compara Estratégias ao longo do tempo, nunca escopado a uma
 * Estratégia específica — por isso vive em `/relatorios/historico`, não em
 * `/relatorios` (reservado na Sidebar para a futura visão da Estratégia
 * ativa, Contexto Estratégico — fora do escopo desta implementação).
 *
 * Fontes documentadas por RFC-007: Estratégia (inferida) e Aprendizado
 * (direta). Execução **não** é fonte documentada de Relatórios — diferente
 * de Biblioteca (RFC-006), que acumula Campanha/Ação diretamente — por isso
 * esta página, deliberadamente, não lista Campanhas nem Ações; fazer isso
 * seria repetir a "decisão arquitetural implícita" que a autorrevisão da
 * própria RFC-007 já identificou e removeu (seta direta de Execução para
 * Relatórios, por analogia indevida com Biblioteca).
 *
 * Nenhum indicador, métrica ou agregação calculada: nenhuma fonte documenta
 * um único exemplo concreto (RFC-007, "Revisão crítica") — listagem
 * cronológica crua, sem inventar conteúdo de produto.
 *
 * Nenhum Service novo: mesmo paralelo estrutural de Biblioteca (RFC-006) —
 * Relatórios não tem domínio próprio; esta página só compõe duas Server
 * Actions já existentes.
 */
export default async function RelatoriosHistoricoPage({ params }: RelatoriosHistoricoPageProps) {
  const { workspaceId } = await params;

  const [estrategias, aprendizados] = await Promise.all([
    listarEstrategiasAction(workspaceId, { limit: 50 }),
    listarAprendizadosAction(workspaceId, undefined, { limit: 50 }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Relatórios — Visão histórica</h1>
        <p className="text-sm text-muted-foreground">
          Comparação de Estratégias do Workspace ao longo do tempo (ADR-005).
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Estratégias</h2>
        {estrategias.items.length === 0 ? (
          <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhuma Estratégia registrada ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {estrategias.items.map((estrategia) => (
              <li key={estrategia.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {STRATEGY_STATUS_LABELS[estrategia.status] ?? estrategia.status}
                  </span>
                  <span className="text-muted-foreground">
                    {estrategia.createdAt.toLocaleDateString('pt-BR')}
                    {estrategia.closedAt && ` → ${estrategia.closedAt.toLocaleDateString('pt-BR')}`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Aprendizado acumulado</h2>
        {aprendizados.items.length === 0 ? (
          <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhum Aprendizado registrado ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {aprendizados.items.map((aprendizado) => (
              <li key={aprendizado.id} className="rounded-md border p-3 text-sm">
                <span className="line-clamp-2">{previewContent(aprendizado.content)}</span>
                <p className="mt-1 text-muted-foreground">
                  {aprendizado.createdAt.toLocaleDateString('pt-BR')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
