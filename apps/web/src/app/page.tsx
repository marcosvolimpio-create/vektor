import { redirect } from 'next/navigation';
import { listarWorkspacesDoUsuarioAction } from '@/actions/workspace.actions';

export default async function HomePage() {
  const workspaces = await listarWorkspacesDoUsuarioAction();
  const [primeiro] = workspaces;

  if (!primeiro) {
    redirect('/onboarding/criar-workspace');
  }

  redirect(`/w/${primeiro.workspaceId}`);
}
