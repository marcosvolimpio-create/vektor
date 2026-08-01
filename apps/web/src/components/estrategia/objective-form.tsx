'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { Button } from '@vektor/ui/button';
import { Input } from '@vektor/ui/input';
import { adicionarObjetivoAction } from '@/actions/estrategia.actions';

interface ObjectiveFormProps {
  workspaceId: string;
  strategyId: string;
}

/**
 * Único ponto que chama `adicionarObjetivoAction`. Qualquer Membro ativo
 * pode adicionar (RFC-003 critério nº2; não está na tabela de ADR-012).
 */
export function ObjectiveForm({ workspaceId, strategyId }: ObjectiveFormProps) {
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
        await adicionarObjetivoAction(workspaceId, strategyId, description);
        router.refresh();
        (document.getElementById('objective-form') as HTMLFormElement | null)?.reset();
      } catch {
        setError('Não foi possível adicionar o Objetivo. Tente novamente.');
      }
    });
  }

  return (
    <form id="objective-form" onSubmit={handleSubmit} className="flex gap-2">
      <Input
        name="description"
        placeholder="Descrição do Objetivo"
        required
        disabled={isPending}
        aria-label="Descrição do Objetivo"
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Adicionando...' : 'Adicionar'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
