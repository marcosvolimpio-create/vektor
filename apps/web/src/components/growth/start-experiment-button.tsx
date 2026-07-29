'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@vektor/ui/button';
import { iniciarExecucaoExperimentoAction } from '@/actions/growth.actions';

interface StartExperimentButtonProps {
  workspaceId: string;
  experimentId: string;
}

/** Encapsula só a interação com `iniciarExecucaoExperimentoAction` — mesmo padrão de `IniciarExecucaoButton` (Ação). */
export function StartExperimentButton({ workspaceId, experimentId }: StartExperimentButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await iniciarExecucaoExperimentoAction(workspaceId, experimentId);
        router.refresh();
      } catch {
        setError('Não foi possível iniciar a execução do Experimento. Tente novamente.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? 'Iniciando...' : 'Iniciar execução'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
