'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { Button } from '@vektor/ui/button';
import { Input } from '@vektor/ui/input';
import { Textarea } from '@vektor/ui/textarea';
import { criarCampanhaAction } from '@/actions/execucao.actions';

interface CriarCampanhaFormProps {
  workspaceId: string;
  strategyId: string;
}

/**
 * Único ponto que chama `criarCampanhaAction` — é o componente que
 * realmente precisa do dado (o formulário que coleta `name`/`description`).
 * Não valida nenhuma regra de negócio: `required` no campo é UX de
 * formulário, não substitui a validação que já ocorre em `ExecucaoService`.
 */
export function CriarCampanhaForm({ workspaceId, strategyId }: CriarCampanhaFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '');
    const description = String(formData.get('description') ?? '');

    startTransition(async () => {
      try {
        const campanha = await criarCampanhaAction(workspaceId, strategyId, {
          name,
          description: description || undefined,
        });
        router.push(`/w/${workspaceId}/execucao/campanhas/${campanha.id}`);
      } catch {
        setError('Não foi possível criar a Campanha. Tente novamente.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Nome
        </label>
        <Input id="name" name="name" required disabled={isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Descrição
        </label>
        <Textarea id="description" name="description" disabled={isPending} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Criando...' : 'Criar Campanha'}
        </Button>
      </div>
    </form>
  );
}
