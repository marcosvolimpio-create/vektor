import { redirect } from 'next/navigation';

interface WorkspaceIndexPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspaceIndexPage({ params }: WorkspaceIndexPageProps) {
  const { workspaceId } = await params;
  redirect(`/w/${workspaceId}/estrategia`);
}
