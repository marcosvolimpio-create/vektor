import Link from 'next/link';
import { listarEvidenciasAction, obterAcaoAction, obterTaticaAction } from '@/actions/execucao.actions';
import { DashboardEmptyState } from './dashboard-empty-state';

interface DashboardEvidencesProps {
  workspaceId: string;
}

/** `content` é jsonb/`unknown` — mesma apresentação usada na listagem do Módulo 7. */
function previewContent(content: unknown): string {
  return typeof content === 'string' ? content : JSON.stringify(content);
}

/**
 * As 5 Evidências mais recentes do Workspace. A rota de detalhe exige
 * `campaignId`/`tacticId`/`actionId`, nenhum dos quais está na própria
 * Evidência (só `actionId`) — resolvidos via `obterAcaoAction` +
 * `obterTaticaAction` (já existentes), até 2 chamadas por item.
 *
 * Trade-off consciente e documentado (análise arquitetural aprovada): padrão
 * N+2N — 1 chamada a `listarEvidencias` + até 5 a `obterAcao` + até 5 a
 * `obterTatica`, cada uma em sua própria transação (ADR-014). Aceito pelo
 * mesmo motivo de `DashboardActions`: `N` travado em 5, buscas indexadas por
 * chave primária, tela de acesso ocasional. Mesma recomendação para uma
 * eventual correção: resolver dentro de uma única transação no Service, não
 * um JOIN cross-repository.
 *
 * Sem "Ver todas": mesma justificativa de `DashboardTactics`.
 */
export async function DashboardEvidences({ workspaceId }: DashboardEvidencesProps) {
  const evidencias = await listarEvidenciasAction(workspaceId, undefined, { limit: 5 });

  const items = await Promise.all(
    evidencias.items.map(async (evidencia) => {
      if (!evidencia.actionId) {
        return null;
      }
      const acao = await obterAcaoAction(workspaceId, evidencia.actionId);
      const tatica = await obterTaticaAction(workspaceId, acao.tacticId);
      return { evidencia, campaignId: tatica.campaignId, tacticId: tatica.id, actionId: acao.id };
    }),
  );

  const resolved = items.filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Últimas Evidências</h2>

      {resolved.length === 0 ? (
        <DashboardEmptyState message="Nenhuma Evidência registrada ainda." />
      ) : (
        <ul className="flex flex-col gap-2">
          {resolved.map(({ evidencia, campaignId, tacticId, actionId }) => (
            <li key={evidencia.id}>
              <Link
                href={`/w/${workspaceId}/execucao/campanhas/${campaignId}/taticas/${tacticId}/acoes/${actionId}/evidencias/${evidencia.id}`}
                className="block rounded-md border p-3 text-sm hover:bg-muted/50"
              >
                <span className="line-clamp-2">{previewContent(evidencia.content)}</span>
                <p className="mt-1 text-muted-foreground">{evidencia.createdAt.toLocaleDateString('pt-BR')}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
