import Link from 'next/link';
import { listarWorkspacesDoUsuarioAction } from '../../actions/workspace.actions';
import { WorkspaceSwitcher } from './workspace-switcher';

interface HeaderProps {
  workspaceId: string;
}

/**
 * Server Component: é quem realmente precisa dos dados do Seletor de
 * Workspace, então é quem chama a Server Action — `WorkspaceSwitcher`
 * recebe só props e não conhece `listarWorkspacesDoUsuarioAction`.
 *
 * Link para Biblioteca (RFC-006) e para Relatórios — visão histórica
 * (RFC-007): ambos Contexto Global, por isso vivem aqui e não em `Sidebar`
 * (Contexto Estratégico). "Relatórios (histórico)" aponta para
 * `/relatorios/historico`, não `/relatorios` — esse segundo caminho
 * permanece reservado na Sidebar para a futura visão da Estratégia ativa
 * (ADR-005), ainda não implementada; o rótulo distingue as duas
 * deliberadamente, para não sugerir que já existem.
 *
 * Link para Configurações (RFC-008): mesma natureza — Contexto Global,
 * fatia Equipe/Permissões apenas (Integrações permanece "Fase 9", sem
 * página própria).
 */
export async function Header({ workspaceId }: HeaderProps) {
  const workspaces = await listarWorkspacesDoUsuarioAction();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-6">
      <span className="text-sm font-semibold">VEKTOR</span>
      <div className="flex items-center gap-4">
        <Link
          href={`/w/${workspaceId}/biblioteca`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Biblioteca
        </Link>
        <Link
          href={`/w/${workspaceId}/relatorios/historico`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Relatórios (histórico)
        </Link>
        <Link
          href={`/w/${workspaceId}/configuracoes`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Configurações
        </Link>
        <WorkspaceSwitcher
          currentWorkspaceId={workspaceId}
          workspaces={workspaces.map((w) => ({ id: w.workspaceId, name: w.workspaceName }))}
        />
      </div>
    </header>
  );
}
