import { obterEstrategiaAtivaAction, listarObjetivosAction } from '@/actions/estrategia.actions';
import { listarAcoesAction, listarTaticasAction } from '@/actions/execucao.actions';
import { obterHipoteseAction } from '@/actions/growth.actions';
import { ExperimentForm } from '@/components/growth/experiment-form';

interface NovoExperimentoPageProps {
  params: Promise<{ workspaceId: string; hypothesisId: string }>;
}

/**
 * Proposta de Experimento (RFC-003, critério nº2): exige um Objetivo da
 * Estratégia ativa e uma Tática ou Ação já existente — ambas listadas aqui
 * para o `<select>` de `ExperimentForm`. A validação de que o Objetivo
 * pertence a uma Estratégia ativa (1ª verificação da dupla amarração) é refeita por
 * `GrowthService.proporExperimento`; esta página só filtra a lista visível
 * pela mesma Estratégia ativa, por conveniência de UX, não por segurança.
 */
export default async function NovoExperimentoPage({ params }: NovoExperimentoPageProps) {
  const { workspaceId, hypothesisId } = await params;

  const hipotese = await obterHipoteseAction(workspaceId, hypothesisId);
  const estrategiaAtiva = await obterEstrategiaAtivaAction(workspaceId);

  if (!estrategiaAtiva) {
    return (
      <div className="flex max-w-md flex-col gap-6">
        <h1 className="text-2xl font-semibold">Propor Experimento</h1>
        <p className="text-sm text-muted-foreground">
          Nenhuma Estratégia ativa neste Workspace — não é possível propor um Experimento.
        </p>
      </div>
    );
  }

  const [objetivos, taticas, acoes] = await Promise.all([
    listarObjetivosAction(workspaceId, estrategiaAtiva.id),
    listarTaticasAction(workspaceId, undefined, { limit: 100 }),
    listarAcoesAction(workspaceId, undefined, { limit: 100 }),
  ]);

  return (
    <div className="flex max-w-md flex-col gap-6">
      <h1 className="text-2xl font-semibold">Propor Experimento</h1>
      <p className="text-sm text-muted-foreground">Para a Hipótese: {hipotese.description}</p>

      {objetivos.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum Objetivo registrado para a Estratégia ativa — cadastre um Objetivo antes de propor um Experimento.
        </p>
      ) : (
        <ExperimentForm
          workspaceId={workspaceId}
          hypothesisId={hypothesisId}
          objectives={objetivos.items}
          tactics={taticas.items}
          actions={acoes.items}
        />
      )}
    </div>
  );
}
