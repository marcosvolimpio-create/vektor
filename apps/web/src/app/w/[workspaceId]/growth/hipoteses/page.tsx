import { HypothesisList } from '@/components/growth/hypothesis-list';

interface HipotesesPageProps {
  params: Promise<{ workspaceId: string }>;
}

/**
 * Listagem completa de Hipóteses (RFC-003). Sem "Nova Hipótese" no cabeçalho:
 * o registro sempre parte de uma Evidência específica — o ponto de entrada é
 * a página de detalhe de Evidência, em Execução.
 */
export default async function HipotesesPage({ params }: HipotesesPageProps) {
  const { workspaceId } = await params;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Hipóteses</h1>
      <HypothesisList workspaceId={workspaceId} />
    </div>
  );
}
