import { obterEstrategiaAtivaAction } from '@/actions/estrategia.actions';
import { CriarCampanhaForm } from '@/components/execucao/criar-campanha-form';

interface NovaCampanhaPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function NovaCampanhaPage({ params }: NovaCampanhaPageProps) {
  const { workspaceId } = await params;
  const estrategiaAtiva = await obterEstrategiaAtivaAction(workspaceId);

  return (
    <div className="flex max-w-md flex-col gap-6">
      <h1 className="text-2xl font-semibold">Criar Campanha</h1>

      {!estrategiaAtiva ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma Estratégia ativa neste Workspace — não é possível criar uma Campanha.
        </p>
      ) : (
        <CriarCampanhaForm workspaceId={workspaceId} strategyId={estrategiaAtiva.id} />
      )}
    </div>
  );
}
