'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@vektor/ui/button';
import { priorizarHipoteseAction } from '@/actions/growth.actions';

interface PrioritizeHypothesisButtonProps {
  workspaceId: string;
  hypothesisId: string;
}

/**
 * Encapsula só a interação com `priorizarHipoteseAction` — a transição
 * `registrada → priorizada` (RFC-004) é validada inteiramente pelo Service;
 * mesmo padrão de `AprovarAcaoButton`.
 */
export function PrioritizeHypothesisButton({ workspaceId, hypothesisId }: PrioritizeHypothesisButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await priorizarHipoteseAction(workspaceId, hypothesisId);
        router.refresh();
      } catch {
        setError('Não foi possível priorizar a Hipótese. Tente novamente.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? 'Priorizando...' : 'Priorizar'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
