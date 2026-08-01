'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { StepType } from '@vektor/services';
import { Button } from '@vektor/ui/button';
import { aprovarEtapaAction } from '@/actions/estrategia.actions';

interface ApproveStepButtonProps {
  workspaceId: string;
  strategyId: string;
  stepType: StepType;
}

/**
 * Único ponto que chama `aprovarEtapaAction`. ADR-012 exige `role = 'admin'`
 * e RFC-001 critério nº2 exige as dependências já aprovadas — ambos
 * verificados inteiramente por `EstrategiaService.aprovarEtapa`, nunca
 * replicados aqui (mesmo padrão de `ApproveExperimentButton`): renderizado
 * sempre, sem checagem de `role` ou de ordem no cliente.
 */
export function ApproveStepButton({ workspaceId, strategyId, stepType }: ApproveStepButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await aprovarEtapaAction(workspaceId, strategyId, stepType);
        router.refresh();
      } catch {
        setError(
          'Não foi possível aprovar a etapa. Verifique se você é admin, se há conteúdo salvo e se as etapas anteriores já estão aprovadas.',
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? 'Aprovando...' : 'Aprovar etapa'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
