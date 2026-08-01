import Link from 'next/link';
import { obterEstrategiaAtivaAction } from '@/actions/estrategia.actions';
import { analisarExecucaoAction } from '@/actions/execution-intelligence.actions';
import { RecommendationCard } from '@/components/execucao/recommendation-card';

interface RecomendacoesPageProps {
  params: Promise<{ workspaceId: string }>;
}

/**
 * Sprint 4 — Execução Inteligente. Roda o motor de análise a cada
 * carregamento (sem job em background — fora do escopo desta Sprint) e
 * mostra as recomendações persistidas (novas + já existentes). Nenhuma
 * recomendação altera o domínio automaticamente — só o próprio registro de
 * recomendação muda de status via `RecommendationCard`.
 */
export default async function RecomendacoesPage({ params }: RecomendacoesPageProps) {
  const { workspaceId } = await params;
  const estrategiaAtiva = await obterEstrategiaAtivaAction(workspaceId);

  if (!estrategiaAtiva) {
    return (
      <div className="flex flex-col gap-6">
        <Link
          href={`/w/${workspaceId}/execucao`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Execução
        </Link>
        <p className="text-sm text-muted-foreground">Nenhuma Estratégia ativa neste Workspace.</p>
      </div>
    );
  }

  const recomendacoes = await analisarExecucaoAction(workspaceId, estrategiaAtiva.id);

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/w/${workspaceId}/execucao`} className="text-sm text-muted-foreground hover:text-foreground">
        ← Execução
      </Link>
      <h1 className="text-2xl font-semibold">Recomendações</h1>

      {recomendacoes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma recomendação no momento — a Execução não apresenta gargalos identificáveis.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {recomendacoes.map((recomendacao) => (
            <RecommendationCard
              key={recomendacao.id}
              workspaceId={workspaceId}
              recommendationId={recomendacao.id}
              priority={recomendacao.priority}
              justification={recomendacao.justification}
              suggestedAction={recomendacao.suggestedAction}
              status={recomendacao.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}
