'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import type { StepType } from '@vektor/services';
import { Button } from '@vektor/ui/button';
import { Textarea } from '@vektor/ui/textarea';
import { preencherEtapaAction } from '@/actions/estrategia.actions';

interface StepContentFormProps {
  workspaceId: string;
  strategyId: string;
  stepType: StepType;
  initialContent: unknown;
}

/**
 * Único ponto que chama `preencherEtapaAction`. Qualquer Membro ativo pode
 * preencher (RFC-001: só a aprovação exige `admin`, não o preenchimento) —
 * `EstrategiaService.preencherEtapa` não faz checagem de `role`.
 */
export function StepContentForm({ workspaceId, strategyId, stepType, initialContent }: StepContentFormProps) {
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
        await preencherEtapaAction(workspaceId, strategyId, stepType, content);
        router.refresh();
      } catch {
        setError('Não foi possível salvar o conteúdo. Tente novamente.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="content" className="text-sm font-medium">
          Conteúdo
        </label>
        <Textarea
          id="content"
          name="content"
          rows={8}
          disabled={isPending}
          defaultValue={typeof initialContent === 'string' ? initialContent : ''}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar conteúdo'}
        </Button>
      </div>
    </form>
  );
}
