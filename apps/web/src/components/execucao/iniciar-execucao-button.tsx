'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@vektor/ui/button';
import { iniciarExecucaoAcaoAction } from '@/actions/execucao.actions';

interface IniciarExecucaoButtonProps {
  workspaceId: string;
  actionId: string;
}

/**
 * Encapsula só a interação com `iniciarExecucaoAcaoAction` — a transição
 * `aprovada → em_execucao` (RFC-004) é validada inteiramente pelo Service;
 * este componente apenas dispara a Action e atualiza a tela via
 * `router.refresh()`.
 */
export function IniciarExecucaoButton({ workspaceId, actionId }: IniciarExecucaoButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await iniciarExecucaoAcaoAction(workspaceId, actionId);
        router.refresh();
      } catch {
        setError('Não foi possível iniciar a execução da Ação. Tente novamente.');
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
