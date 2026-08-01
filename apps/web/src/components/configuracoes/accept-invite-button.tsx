'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@vektor/ui/button';
import { aceitarConviteAction } from '@/actions/configuracoes.actions';

interface AcceptInviteButtonProps {
  workspaceId: string;
}

export function AcceptInviteButton({ workspaceId }: AcceptInviteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await aceitarConviteAction(workspaceId);
        router.push(`/w/${workspaceId}`);
      } catch {
        setError(
          'Não foi possível aceitar o convite. Verifique se você foi convidado com este e-mail e se ele está confirmado.',
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? 'Aceitando...' : 'Aceitar convite'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
