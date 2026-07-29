'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { Button } from '@vektor/ui/button';
import { Input } from '@vektor/ui/input';
import { Textarea } from '@vektor/ui/textarea';
import { criarAcaoAction } from '@/actions/execucao.actions';

interface CriarAcaoFormProps {
  workspaceId: string;
  campaignId: string;
  tacticId: string;
}

/**
 * Único ponto que chama `criarAcaoAction` — mesmo padrão de
 * `CriarCampanhaForm`/`CriarTaticaForm`. Não resolve nem valida Estratégia
 * ativa aqui: `ExecucaoService.criarAcao` já resolve a cadeia Tática →
 * Campanha → Estratégia e valida internamente — duplicar essa checagem na UI
 * violaria "não duplicar validações já existentes no ExecucaoService".
 */
export function CriarAcaoForm({ workspaceId, campaignId, tacticId }: CriarAcaoFormProps) {
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
        const acao = await criarAcaoAction(workspaceId, tacticId, {
          name,
          description: description || undefined,
        });
        router.push(`/w/${workspaceId}/execucao/campanhas/${campaignId}/taticas/${tacticId}/acoes/${acao.id}`);
      } catch {
        setError('Não foi possível criar a Ação. Tente novamente.');
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
          {isPending ? 'Criando...' : 'Criar Ação'}
        </Button>
      </div>
    </form>
  );
}
