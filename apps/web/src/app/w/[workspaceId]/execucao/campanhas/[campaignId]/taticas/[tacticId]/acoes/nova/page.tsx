import { CriarAcaoForm } from '@/components/execucao/criar-acao-form';

interface NovaAcaoPageProps {
  params: Promise<{ workspaceId: string; campaignId: string; tacticId: string }>;
}

export default async function NovaAcaoPage({ params }: NovaAcaoPageProps) {
  const { workspaceId, campaignId, tacticId } = await params;

  return (
    <div className="flex max-w-md flex-col gap-6">
      <h1 className="text-2xl font-semibold">Criar Ação</h1>
      <CriarAcaoForm workspaceId={workspaceId} campaignId={campaignId} tacticId={tacticId} />
    </div>
  );
}
