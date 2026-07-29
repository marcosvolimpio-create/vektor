import { CriarEvidenciaForm } from '@/components/execucao/criar-evidencia-form';

interface NovaEvidenciaPageProps {
  params: Promise<{ workspaceId: string; campaignId: string; tacticId: string; actionId: string }>;
}

export default async function NovaEvidenciaPage({ params }: NovaEvidenciaPageProps) {
  const { workspaceId, campaignId, tacticId, actionId } = await params;

  return (
    <div className="flex max-w-md flex-col gap-6">
      <h1 className="text-2xl font-semibold">Registrar Evidência</h1>
      <CriarEvidenciaForm
        workspaceId={workspaceId}
        campaignId={campaignId}
        tacticId={tacticId}
        actionId={actionId}
      />
    </div>
  );
}
