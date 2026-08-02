import { redirect } from 'next/navigation';

interface GrowthIndexPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function GrowthIndexPage({ params }: GrowthIndexPageProps) {
  const { workspaceId } = await params;
  redirect(`/w/${workspaceId}/growth/hipoteses`);
}
