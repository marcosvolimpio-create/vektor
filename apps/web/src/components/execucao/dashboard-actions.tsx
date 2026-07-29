import Link from 'next/link';
import { listarAcoesAction, obterTaticaAction } from '@/actions/execucao.actions';
import { DashboardEmptyState } from './dashboard-empty-state';

interface DashboardActionsProps {
  workspaceId: string;
}

/** Rótulo de apresentação — não é regra de negócio, só tradução do enum já validado pelo Service. */
const STATUS_LABELS: Record<string, string> = {
  proposta: 'Proposta',
  aprovada: 'Aprovada',
  em_execucao: 'Em execução',
  concluida: 'Concluída',
  publicada: 'Publicada',
};

/**
 * As 5 Ações mais recentes do Workspace. `Action` só tem `tacticId`, não
 * `campaignId` — a rota de detalhe (`/campanhas/[campaignId]/taticas/[tacticId]/acoes/[actionId]`)
 * exige os três segmentos, então resolvemos o `campaignId` via
 * `obterTaticaAction` (já existente) — não é uma consulta nova, é reuso da
 * Action já usada no Módulo 6.
 *
 * Trade-off consciente e documentado (análise arquitetural aprovada): isso é
 * um padrão N+1 — 1 chamada a `listarAcoes` + até 5 a `obterTatica`, cada uma
 * abrindo sua própria transação (ADR-014), não uma única. Aceito porque `N`
 * é travado em 5 pelo `limit`, nunca escala com o tamanho do Workspace, e
 * cada busca é um `WHERE workspace_id = ? AND id = ?` indexado — custo
 * absoluto pequeno para uma tela acessada ocasionalmente. Se este padrão for
 * reutilizado em um contexto de alto tráfego ou limite maior, a correção
 * recomendada é mover a resolução para dentro de uma única transação no
 * Service, não um JOIN cross-repository.
 *
 * Sem "Ver todas": mesma justificativa de `DashboardTactics`.
 */
export async function DashboardActions({ workspaceId }: DashboardActionsProps) {
  const acoes = await listarAcoesAction(workspaceId, undefined, { limit: 5 });

  const items = await Promise.all(
    acoes.items.map(async (acao) => {
      const tatica = await obterTaticaAction(workspaceId, acao.tacticId);
      return { acao, campaignId: tatica.campaignId };
    }),
  );

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Últimas Ações</h2>

      {items.length === 0 ? (
        <DashboardEmptyState message="Nenhuma Ação criada ainda." />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map(({ acao, campaignId }) => (
            <li key={acao.id}>
              <Link
                href={`/w/${workspaceId}/execucao/campanhas/${campaignId}/taticas/${acao.tacticId}/acoes/${acao.id}`}
                className="block rounded-md border p-3 text-sm hover:bg-muted/50"
              >
                <span className="font-medium">{acao.name}</span>
                <span className="ml-2 text-muted-foreground">{STATUS_LABELS[acao.status] ?? acao.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
