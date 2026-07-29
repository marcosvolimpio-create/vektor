'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@vektor/ui/button';
import { aprovarExperimentoAction } from '@/actions/growth.actions';

interface ApproveExperimentButtonProps {
  workspaceId: string;
  experimentId: string;
}

/**
 * Encapsula só a interação com `aprovarExperimentoAction`. ADR-012 exige
 * `role = 'admin'` — verificado inteiramente por `GrowthService`, nunca
 * neste componente: renderizado sempre (mesmo padrão de `AprovarAcaoButton`,
 * que também não esconde botões por `role` — não há, em nenhum lugar do
 * projeto, um mecanismo de leitura de `actor.role` do lado do componente de
 * página; inventar um aqui introduziria uma infraestrutura nova sem
 * precedente). Um Membro sem `admin` recebe o erro genérico abaixo, vindo de
 * `AutorizacaoInsuficienteError` — a UI nunca é a camada de decisão.
 */
export function ApproveExperimentButton({ workspaceId, experimentId }: ApproveExperimentButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await aprovarExperimentoAction(workspaceId, experimentId);
        router.refresh();
      } catch {
        setError('Não foi possível aprovar o Experimento. Verifique se você é admin do Workspace.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? 'Aprovando...' : 'Aprovar Experimento'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
