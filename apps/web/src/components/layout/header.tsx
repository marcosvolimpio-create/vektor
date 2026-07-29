import { listarWorkspacesDoUsuarioAction } from '../../actions/workspace.actions';
import { WorkspaceSwitcher } from './workspace-switcher';

interface HeaderProps {
  workspaceId: string;
}

/**
 * Server Component: é quem realmente precisa dos dados do Seletor de
 * Workspace, então é quem chama a Server Action — `WorkspaceSwitcher`
 * recebe só props e não conhece `listarWorkspacesDoUsuarioAction`.
 */
export async function Header({ workspaceId }: HeaderProps) {
  const workspaces = await listarWorkspacesDoUsuarioAction();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-6">
      <span className="text-sm font-semibold">VEKTOR</span>
      <WorkspaceSwitcher
        currentWorkspaceId={workspaceId}
        workspaces={workspaces.map((w) => ({ id: w.workspaceId, name: w.workspaceName }))}
      />
    </header>
  );
}
