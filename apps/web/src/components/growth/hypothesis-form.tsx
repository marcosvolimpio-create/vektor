'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { Button } from '@vektor/ui/button';
import { Textarea } from '@vektor/ui/textarea';
import { registrarHipoteseAction } from '@/actions/growth.actions';

interface HypothesisFormProps {
  workspaceId: string;
  evidenceId: string;
}

/**
 * Único ponto que chama `registrarHipoteseAction` — mesmo padrão de
 * `CriarAcaoForm`. Não valida a Evidência aqui: `GrowthService.registrarHipotese`
 * já valida que ela existe no Workspace (RFC-003, critério nº1).
 */
export function HypothesisForm({ workspaceId, evidenceId }: HypothesisFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const description = String(formData.get('description') ?? '');

    startTransition(async () => {
      try {
        const hipotese = await registrarHipoteseAction(workspaceId, evidenceId, description);
        router.push(`/w/${workspaceId}/growth/hipoteses/${hipotese.id}`);
      } catch {
        setError('Não foi possível registrar a Hipótese. Tente novamente.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Hipótese
        </label>
        <Textarea id="description" name="description" required disabled={isPending} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Registrando...' : 'Registrar Hipótese'}
        </Button>
      </div>
    </form>
  );
}
