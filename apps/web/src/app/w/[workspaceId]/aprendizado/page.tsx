import { obterEstrategiaAtivaAction } from '@/actions/estrategia.actions';
import { EvoluirEstrategiaButton } from '@/components/aprendizado/evoluir-estrategia-button';
import { LearningList } from '@/components/aprendizado/learning-list';

interface AprendizadoPageProps {
  params: Promise<{ workspaceId: string }>;
}

/**
 * Listagem de Aprendizado (RFC-005) + gatilho de "Evoluir Estratégia"
 * (ADR-002). Sem "Novo Aprendizado" no cabeçalho: o registro sempre parte de
 * uma Evidência específica — o ponto de entrada é a página de detalhe de
 * Evidência, em Execução (mesmo padrão de Hipótese, Growth).
 */
export default async function AprendizadoPage({ params }: AprendizadoPageProps) {
  const { workspaceId } = await params;
  const estrategiaAtiva = await obterEstrategiaAtivaAction(workspaceId);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Aprendizado</h1>

      {estrategiaAtiva && (
        <div className="rounded-md border p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Encerra a Estratégia ativa e inicia a próxima, informada pelo Aprendizado acumulado.
          </p>
          <EvoluirEstrategiaButton workspaceId={workspaceId} currentStrategyId={estrategiaAtiva.id} />
        </div>
      )}

      <LearningList workspaceId={workspaceId} />
    </div>
  );
}
