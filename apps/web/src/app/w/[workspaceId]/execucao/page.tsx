import { obterEstrategiaAtivaAction } from '@/actions/estrategia.actions';
import { DashboardActions } from '@/components/execucao/dashboard-actions';
import { DashboardCampaigns } from '@/components/execucao/dashboard-campaigns';
import { DashboardCards } from '@/components/execucao/dashboard-cards';
import { DashboardEmptyState } from '@/components/execucao/dashboard-empty-state';
import { DashboardEvidences } from '@/components/execucao/dashboard-evidences';
import { DashboardTactics } from '@/components/execucao/dashboard-tactics';
import { IniciarFormulacaoButton } from '@/components/execucao/iniciar-formulacao-button';

interface ExecucaoPageProps {
  params: Promise<{ workspaceId: string }>;
}

/** Rótulo de apresentação — não é regra de negócio, só tradução do enum já validado pelo Service. */
const STATUS_LABELS: Record<string, string> = {
  ativa: 'Ativa',
  encerrada: 'Encerrada',
};

/**
 * Dashboard de Execução (Módulo 9) — composição pura dos dados já
 * disponíveis via Server Actions existentes; nenhuma regra de negócio,
 * nenhum Service/Repository/Action novo.
 *
 * Bloco "Estratégia Ativa" exibe apenas Status e Data de criação —
 * `Strategy` não tem campo `name` no domínio (Lacuna 1, aprovada: requisito
 * removido do escopo, sem alteração de schema).
 */
export default async function ExecucaoPage({ params }: ExecucaoPageProps) {
  const { workspaceId } = await params;
  const estrategiaAtiva = await obterEstrategiaAtivaAction(workspaceId);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Execução</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Estratégia Ativa</h2>
        {!estrategiaAtiva ? (
          <DashboardEmptyState message="Nenhuma Estratégia ativa neste Workspace.">
            <IniciarFormulacaoButton workspaceId={workspaceId} />
          </DashboardEmptyState>
        ) : (
          <dl className="flex flex-col gap-4 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Status</dt>
              <dd className="mt-1">{STATUS_LABELS[estrategiaAtiva.status] ?? estrategiaAtiva.status}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Data de criação</dt>
              <dd className="mt-1">{estrategiaAtiva.createdAt.toLocaleDateString('pt-BR')}</dd>
            </div>
          </dl>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Indicadores</h2>
        <DashboardCards workspaceId={workspaceId} />
      </section>

      <DashboardCampaigns workspaceId={workspaceId} />
      <DashboardTactics workspaceId={workspaceId} />
      <DashboardActions workspaceId={workspaceId} />
      <DashboardEvidences workspaceId={workspaceId} />
    </div>
  );
}
