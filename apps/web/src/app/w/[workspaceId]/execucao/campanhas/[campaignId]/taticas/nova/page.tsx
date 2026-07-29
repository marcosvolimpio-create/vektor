import { CriarTaticaForm } from '@/components/execucao/criar-tatica-form';

interface NovaTaticaPageProps {
  params: Promise<{ workspaceId: string; campaignId: string }>;
}

export default async function NovaTaticaPage({ params }: NovaTaticaPageProps) {
  const { workspaceId, campaignId } = await params;

  return (
    <div className="flex max-w-md flex-col gap-6">
      <h1 className="text-2xl font-semibold">Criar Tática</h1>
      <CriarTaticaForm workspaceId={workspaceId} campaignId={campaignId} />
    </div>
  );
}
