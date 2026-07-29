'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@vektor/ui/button';
import { aprovarAcaoAction } from '@/actions/execucao.actions';

interface AprovarAcaoButtonProps {
  workspaceId: string;
  actionId: string;
}

/**
 * Encapsula só a interação com `aprovarAcaoAction` — a transição
 * `proposta → aprovada` (RFC-004) é validada inteiramente pelo Service; este
 * componente apenas dispara a Action e atualiza a tela via `router.refresh()`.
 */
export function AprovarAcaoButton({ workspaceId, actionId }: AprovarAcaoButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await aprovarAcaoAction(workspaceId, actionId);
        router.refresh();
      } catch {
        setError('Não foi possível aprovar a Ação. Tente novamente.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? 'Aprovando...' : 'Aprovar'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
