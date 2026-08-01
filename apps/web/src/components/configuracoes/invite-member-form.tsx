'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { Button } from '@vektor/ui/button';
import { Input } from '@vektor/ui/input';
import { Select } from '@vektor/ui/select';
import { convidarMembroAction } from '@/actions/configuracoes.actions';

interface InviteMemberFormProps {
  workspaceId: string;
}

/**
 * Único ponto que chama `convidarMembroAction`. ADR-012 exige `role = 'admin'`
 * — verificado inteiramente por `ConfiguracoesService`, nunca neste
 * componente (mesmo padrão de `ApproveExperimentButton`/`EvoluirEstrategiaButton`):
 * renderizado sempre, sem checagem de `role` no cliente.
 */
export function InviteMemberForm({ workspaceId }: InviteMemberFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const role = formData.get('role') === 'admin' ? 'admin' : 'membro';

    startTransition(async () => {
      try {
        await convidarMembroAction(workspaceId, email, role);
        router.refresh();
        (document.getElementById('invite-member-form') as HTMLFormElement | null)?.reset();
      } catch {
        setError('Não foi possível convidar o Membro. Verifique se você é admin do Workspace e se o e-mail já não foi convidado.');
      }
    });
  }

  return (
    <form id="invite-member-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          E-mail
        </label>
        <Input id="email" name="email" type="email" required disabled={isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="role" className="text-sm font-medium">
          Papel
        </label>
        <Select id="role" name="role" disabled={isPending} defaultValue="membro">
          <option value="membro">Membro</option>
          <option value="admin">Admin</option>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Convidando...' : 'Convidar Membro'}
        </Button>
      </div>
    </form>
  );
}
