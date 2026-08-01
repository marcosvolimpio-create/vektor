'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@vektor/ui/button';
import { iniciarFormulacaoAction } from '@/actions/estrategia.actions';

interface StartFormulationButtonProps {
  workspaceId: string;
}

/**
 * Único ponto que chama `iniciarFormulacaoAction`. ADR-015: a Estratégia já
 * nasce `ativa`, sem estado de rascunho. Não exige `admin` — `EstrategiaService.iniciarFormulacao`
 * não faz essa checagem (mesmo padrão de `StartExperimentButton`/`PrioritizeHypothesisButton`).
 */
export function StartFormulationButton({ workspaceId }: StartFormulationButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await iniciarFormulacaoAction(workspaceId);
        router.refresh();
      } catch {
        setError('Não foi possível iniciar a formulação. Tente novamente.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? 'Iniciando...' : 'Iniciar formulação da Estratégia'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
