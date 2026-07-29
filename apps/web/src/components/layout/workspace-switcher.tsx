'use client';

import { useRouter, usePathname } from 'next/navigation';
import type { ChangeEvent } from 'react';

export interface WorkspaceOption {
  id: string;
  name: string;
}

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceOption[];
  currentWorkspaceId: string;
}

/**
 * Componente de apresentação: recebe a lista já resolvida (nome incluído)
 * via props — não chama nenhuma Server Action. Quem busca os dados é o
 * Header, que é quem realmente precisa deles (`listarWorkspacesDoUsuarioAction`).
 *
 * Ao trocar de Workspace, preserva o restante do caminho — apenas o
 * segmento `[workspaceId]` muda (`docs/implementation/frontend/routing.md`:
 * "workspaceId sempre vem da URL").
 */
export function WorkspaceSwitcher({ workspaces, currentWorkspaceId }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextWorkspaceId = event.currentTarget.value;
    if (nextWorkspaceId === currentWorkspaceId) {
      return;
    }
    const segments = pathname.split('/');
    // segments: ['', 'w', workspaceId, ...resto]
    segments[2] = nextWorkspaceId;
    router.push(segments.join('/'));
  }

  return (
    <select
      aria-label="Selecionar Workspace"
      value={currentWorkspaceId}
      onChange={handleChange}
      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
    >
      {workspaces.map((workspace) => (
        <option key={workspace.id} value={workspace.id}>
          {workspace.name}
        </option>
      ))}
    </select>
  );
}
