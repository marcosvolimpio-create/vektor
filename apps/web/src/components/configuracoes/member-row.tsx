'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { Member, MemberRole } from '@vektor/services';
import { Button } from '@vektor/ui/button';
import { Select } from '@vektor/ui/select';
import { alterarRoleAction, removerMembroAction } from '@/actions/configuracoes.actions';

interface MemberRowProps {
  workspaceId: string;
  member: Member;
}

/** Rótulos de apresentação — não são regra de negócio, só tradução dos enums já validados pelo Service. */
const STATUS_LABELS: Record<string, string> = {
  convidado: 'Convidado',
  ativo: 'Ativo',
  removido: 'Removido',
};

/**
 * Encapsula a interação com `alterarRoleAction`/`removerMembroAction`. ADR-012
 * exige `role = 'admin'` no ator para ambas — verificado inteiramente por
 * `ConfiguracoesService`, nunca aqui (mesmo padrão de `ApproveExperimentButton`):
 * controles renderizados sempre, sem checagem de `role` no cliente. Membro já
 * `removido` não recebe mais nenhuma ação (Regra Absoluta nº8 — remoção é
 * sempre soft, mas a UI não precisa oferecer transição a partir de um estado
 * terminal que a fonte não documenta).
 */
export function MemberRow({ workspaceId, member }: MemberRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRoleChange(newRole: MemberRole) {
    setError(null);
    startTransition(async () => {
      try {
        await alterarRoleAction(workspaceId, member.id, newRole);
        router.refresh();
      } catch {
        setError('Não foi possível alterar o papel. Verifique se você é admin do Workspace.');
      }
    });
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      try {
        await removerMembroAction(workspaceId, member.id);
        router.refresh();
      } catch {
        setError('Não foi possível remover o Membro. Verifique se você é admin do Workspace.');
      }
    });
  }

  return (
    <li className="flex flex-col gap-2 rounded-md border p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{member.email}</span>
        <span className="text-muted-foreground">{STATUS_LABELS[member.status] ?? member.status}</span>
      </div>

      {member.status !== 'removido' && (
        <div className="flex items-center gap-2">
          <Select
            aria-label={`Papel de ${member.email}`}
            value={member.role}
            disabled={isPending}
            onChange={(event) => handleRoleChange(event.target.value as MemberRole)}
            className="h-8 w-32"
          >
            <option value="membro">Membro</option>
            <option value="admin">Admin</option>
          </Select>
          <Button variant="outline" onClick={handleRemove} disabled={isPending}>
            {isPending ? 'Aguarde...' : 'Remover'}
          </Button>
        </div>
      )}

      {error && <p className="text-destructive">{error}</p>}
    </li>
  );
}
