import { listarMembrosAction } from '@/actions/configuracoes.actions';
import { MemberRow } from './member-row';

interface MemberListProps {
  workspaceId: string;
}

/** Listagem de Membros do Workspace (RFC-008, fatia Equipe/Permissões). */
export async function MemberList({ workspaceId }: MemberListProps) {
  const membros = await listarMembrosAction(workspaceId, { limit: 50 });

  if (membros.items.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhum Membro neste Workspace ainda.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {membros.items.map((membro) => (
        <MemberRow key={membro.id} workspaceId={workspaceId} member={membro} />
      ))}
    </ul>
  );
}
