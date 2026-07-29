'use server';

import type { CriarWorkspaceResult, WorkspaceDoUsuario } from '@vektor/services';
import { getAuthenticatedUser } from '../server/auth';
import { createWorkspaceService, runInRequestContext } from '../server/composition-root';

/** ADR-013: self-service — qualquer usuário autenticado cria seu Workspace. */
export async function criarWorkspaceAction(workspaceName: string): Promise<CriarWorkspaceResult> {
  const { userId, email } = await getAuthenticatedUser();
  return runInRequestContext(userId, (tx) =>
    createWorkspaceService(tx).criarWorkspace({ userId, email, workspaceName }),
  );
}

/**
 * Alimenta o Seletor de Workspace (Header) e a resolução de "a quais
 * Workspaces este usuário pertence" antes de um `workspaceId` estar na URL.
 * Sem parâmetro de `workspaceId`: é, por definição, a consulta que não é
 * escopada a um único Workspace.
 */
export async function listarWorkspacesDoUsuarioAction(): Promise<WorkspaceDoUsuario[]> {
  const { userId } = await getAuthenticatedUser();
  return runInRequestContext(userId, (tx) => createWorkspaceService(tx).listarWorkspacesDoUsuario(userId));
}
