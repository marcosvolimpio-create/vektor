import { redirect } from 'next/navigation';

interface RelatoriosIndexPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function RelatoriosIndexPage({ params }: RelatoriosIndexPageProps) {
  const { workspaceId } = await params;
  redirect(`/w/${workspaceId}/relatorios/historico`);
}
