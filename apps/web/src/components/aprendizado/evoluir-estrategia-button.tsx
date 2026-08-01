'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@vektor/ui/button';
import { evoluirEstrategiaAction } from '@/actions/aprendizado.actions';

interface EvoluirEstrategiaButtonProps {
  workspaceId: string;
  currentStrategyId: string;
}

/**
 * Encapsula só a interação com `evoluirEstrategiaAction`. ADR-012 exige
 * `role = 'admin'` — verificado inteiramente por `AprendizadoService`, nunca
 * neste componente (mesmo padrão de `ApproveExperimentButton`, Growth):
 * renderizado sempre, sem checagem de `role` no cliente — não há, em nenhum
 * lugar do projeto, um mecanismo de leitura de `actor.role` do lado da
 * página. Um Membro sem `admin` recebe o erro genérico abaixo.
 */
export function EvoluirEstrategiaButton({ workspaceId, currentStrategyId }: EvoluirEstrategiaButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await evoluirEstrategiaAction(workspaceId, currentStrategyId);
        // `/w/[workspaceId]/estrategia` ainda não tem página construída
        // (só Service/Actions) — volta para Aprendizado, que já existe.
        router.push(`/w/${workspaceId}/aprendizado`);
        router.refresh();
      } catch {
        setError('Não foi possível evoluir a Estratégia. Verifique se você é admin do Workspace.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? 'Evoluindo...' : 'Evoluir Estratégia'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
