import { InviteMemberForm } from '@/components/configuracoes/invite-member-form';
import { MemberList } from '@/components/configuracoes/member-list';

interface ConfiguracoesPageProps {
  params: Promise<{ workspaceId: string }>;
}

/**
 * Configurações (RFC-008) — fatia Equipe/Permissões (ADR-011/ADR-012).
 * Contexto Global, "fora do ciclo" (Blueprint, Cap. 3.5): disponível desde a
 * criação do Workspace, sem depender de Estratégia ativa.
 *
 * Integrações fica fora desta página — RFC-008 declara isso "Fase 9",
 * sem base documental para desenhar UI ou Service agora.
 */
export default async function ConfiguracoesPage({ params }: ConfiguracoesPageProps) {
  const { workspaceId } = await params;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Configurações</h1>

      <section className="flex max-w-md flex-col gap-3">
        <h2 className="text-lg font-medium">Convidar Membro</h2>
        <InviteMemberForm workspaceId={workspaceId} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Equipe</h2>
        <MemberList workspaceId={workspaceId} />
      </section>
    </div>
  );
}
