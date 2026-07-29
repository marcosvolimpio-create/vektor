'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { Button } from '@vektor/ui/button';
import { Select } from '@vektor/ui/select';
import { Textarea } from '@vektor/ui/textarea';
import { concluirExperimentoAction } from '@/actions/growth.actions';

interface ConcludeExperimentFormProps {
  workspaceId: string;
  experimentId: string;
}

/**
 * Encapsula só a interação com `concluirExperimentoAction`. `resultado`
 * (Validada/Refutada) é sempre uma escolha humana explícita neste form —
 * nunca inferida (RFC-003, "Onde a IA nunca toma decisões"; AQ-002). A
 * criação de Evidência e a transição da Hipótese acontecem juntas no
 * Service (RFC-003/004); este componente não chama nada além desta Action.
 */
export function ConcludeExperimentForm({ workspaceId, experimentId }: ConcludeExperimentFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const content = String(formData.get('content') ?? '');
    const resultado = formData.get('resultado');

    if (resultado !== 'validada' && resultado !== 'refutada') {
      setError('Selecione o resultado do Experimento.');
      return;
    }

    startTransition(async () => {
      try {
        await concluirExperimentoAction(workspaceId, experimentId, { content, resultado });
        router.refresh();
      } catch {
        setError('Não foi possível concluir o Experimento. Tente novamente.');
      }
    });
  }

  if (!isOpen) {
    return <Button onClick={() => setIsOpen(true)}>Concluir Experimento</Button>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="content" className="text-sm font-medium">
          Evidência
        </label>
        <Textarea id="content" name="content" required disabled={isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="resultado" className="text-sm font-medium">
          Resultado
        </label>
        <Select id="resultado" name="resultado" required disabled={isPending} defaultValue="">
          <option value="" disabled>
            Selecione o resultado
          </option>
          <option value="validada">Validada — o Experimento confirmou a Hipótese</option>
          <option value="refutada">Refutada — o Experimento não confirmou a Hipótese</option>
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Concluindo...' : 'Concluir Experimento'}
        </Button>
        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
