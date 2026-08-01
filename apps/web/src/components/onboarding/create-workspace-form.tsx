'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { Button } from '@vektor/ui/button';
import { Input } from '@vektor/ui/input';
import { criarWorkspaceAction } from '@/actions/workspace.actions';

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const workspaceName = String(formData.get('workspaceName') ?? '');

    startTransition(async () => {
      try {
        const result = await criarWorkspaceAction(workspaceName);
        router.push(`/w/${result.workspace.id}`);
      } catch {
        setError('Não foi possível criar o Workspace. Tente novamente.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="workspaceName" className="text-sm font-medium">
          Nome do Workspace
        </label>
        <Input id="workspaceName" name="workspaceName" required disabled={isPending} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Criando...' : 'Criar Workspace'}
      </Button>
    </form>
  );
}
