'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { Button } from '@vektor/ui/button';
import { Textarea } from '@vektor/ui/textarea';
import { registrarAprendizadoAction } from '@/actions/aprendizado.actions';

interface LearningFormProps {
  workspaceId: string;
  evidenceId: string;
}

/**
 * Único ponto que chama `registrarAprendizadoAction` — mesmo padrão de
 * `HypothesisForm` (Growth). Não valida a Evidência aqui:
 * `AprendizadoService.registrarAprendizado` já valida que ela existe no
 * Workspace (RFC-005, critério nº1).
 */
export function LearningForm({ workspaceId, evidenceId }: LearningFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const content = String(formData.get('content') ?? '');

    startTransition(async () => {
      try {
        const aprendizado = await registrarAprendizadoAction(workspaceId, evidenceId, content);
        router.push(`/w/${workspaceId}/aprendizado/${aprendizado.id}`);
      } catch {
        setError('Não foi possível registrar o Aprendizado. Tente novamente.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="content" className="text-sm font-medium">
          Aprendizado
        </label>
        <Textarea id="content" name="content" required disabled={isPending} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Registrando...' : 'Registrar Aprendizado'}
        </Button>
      </div>
    </form>
  );
}
