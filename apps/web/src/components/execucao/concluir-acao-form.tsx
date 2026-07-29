'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { Button } from '@vektor/ui/button';
import { Textarea } from '@vektor/ui/textarea';
import { concluirAcaoAction } from '@/actions/execucao.actions';

interface ConcluirAcaoFormProps {
  workspaceId: string;
  actionId: string;
}

/**
 * Encapsula só a interação com `concluirAcaoAction` — a transição
 * `em_execucao → concluida` e a criação automática de Evidência (RFC-002
 * crit. nº5) já acontecem juntas dentro do Service; este componente não
 * chama `registrarEvidencia` nem nada além desta única Action.
 */
export function ConcluirAcaoForm({ workspaceId, actionId }: ConcluirAcaoFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const content = String(formData.get('content') ?? '');

    startTransition(async () => {
      try {
        await concluirAcaoAction(workspaceId, actionId, { content });
        router.refresh();
      } catch {
        setError('Não foi possível concluir a Ação. Tente novamente.');
      }
    });
  }

  if (!isOpen) {
    return <Button onClick={() => setIsOpen(true)}>Concluir ação</Button>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="content" className="text-sm font-medium">
          Evidência
        </label>
        <Textarea id="content" name="content" required disabled={isPending} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Concluindo...' : 'Concluir ação'}
        </Button>
        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
