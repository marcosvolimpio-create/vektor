import Link from 'next/link';
import { obterEstrategiaAtivaAction } from '@/actions/estrategia.actions';
import { LearningList } from '@/components/aprendizado/learning-list';
import { StartFormulationButton } from '@/components/estrategia/start-formulation-button';
import { StepList } from '@/components/estrategia/step-list';

interface EstrategiaPageProps {
  params: Promise<{ workspaceId: string }>;
}

/**
 * Dashboard de Estratégia (RFC-001, RFC-009). Sem Service novo: compõe
 * Server Actions já existentes. "Evoluir Estratégia" não aparece aqui —
 * ADR-002 fixa essa ação dentro do módulo Aprendizado; só um link.
 * "Histórico" não é reconstruído aqui — aponta para `/relatorios/historico`
 * (RFC-007), já construído, evitando duplicação (RFC-009, Revisão crítica).
 */
export default async function EstrategiaPage({ params }: EstrategiaPageProps) {
  const { workspaceId } = await params;
  const estrategiaAtiva = await obterEstrategiaAtivaAction(workspaceId);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Estratégia</h1>

      {!estrategiaAtiva ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">Nenhuma Estratégia ativa neste Workspace.</p>
          <StartFormulationButton workspaceId={workspaceId} />
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">Marketing Planning Framework</h2>
            <StepList workspaceId={workspaceId} strategyId={estrategiaAtiva.id} />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">Aprendizado relevante</h2>
            <LearningList workspaceId={workspaceId} />
          </section>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/w/${workspaceId}/relatorios/historico`}
              className="block max-w-xs rounded-md border p-4 text-sm hover:bg-muted/50"
            >
              <span className="font-medium">Histórico</span>
              <p className="mt-1 text-muted-foreground">Ver Estratégias anteriores (Relatórios).</p>
            </Link>
            <Link
              href={`/w/${workspaceId}/aprendizado`}
              className="block max-w-xs rounded-md border p-4 text-sm hover:bg-muted/50"
            >
              <span className="font-medium">Evoluir Estratégia</span>
              <p className="mt-1 text-muted-foreground">Disponível em Aprendizado.</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
