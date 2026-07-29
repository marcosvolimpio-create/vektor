import type { ReactNode } from 'react';
import { Breadcrumb } from '../../../components/layout/breadcrumb';
import { Header } from '../../../components/layout/header';
import { Sidebar } from '../../../components/layout/sidebar';

interface WorkspaceLayoutProps {
  children: ReactNode;
  params: Promise<{ workspaceId: string }>;
}

/**
 * Layout base do Contexto Estratégico (`docs/implementation/frontend/routing.md`):
 * todo módulo sob `/w/[workspaceId]/...` é renderizado dentro deste shell.
 * Só compõe Sidebar/Header/Breadcrumb e repassa `workspaceId` (valor de
 * roteamento, não de negócio) — não resolve `ActorContext` nem chama nenhum
 * Service/Action diretamente. A única chamada a uma Server Action nesta
 * árvore acontece dentro de `Header`, que é quem realmente precisa do dado;
 * `Sidebar` e `Breadcrumb` são puramente derivados da URL.
 */
export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const { workspaceId } = await params;

  return (
    <div className="flex min-h-screen">
      <Sidebar workspaceId={workspaceId} />
      <div className="flex flex-1 flex-col">
        <Header workspaceId={workspaceId} />
        <Breadcrumb />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
