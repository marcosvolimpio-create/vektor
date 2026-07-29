'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { Button } from '@vektor/ui/button';
import { Input } from '@vektor/ui/input';
import { Textarea } from '@vektor/ui/textarea';
import { criarTaticaAction } from '@/actions/execucao.actions';

interface CriarTaticaFormProps {
  workspaceId: string;
  campaignId: string;
}

/**
 * Único ponto que chama `criarTaticaAction` — mesmo padrão de
 * `CriarCampanhaForm`. Não resolve nem valida Estratégia ativa aqui: isso já
 * é feito por `ExecucaoService.criarTatica` (via `garantirEstrategiaAtiva`,
 * resolvendo a Campanha internamente) — duplicar essa checagem na UI violaria
 * "não duplicar regras existentes em ExecucaoService".
 */
export function CriarTaticaForm({ workspaceId, campaignId }: CriarTaticaFormProps) {
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
        const tatica = await criarTaticaAction(workspaceId, campaignId, {
          name,
          description: description || undefined,
        });
        router.push(`/w/${workspaceId}/execucao/campanhas/${campaignId}/taticas/${tatica.id}`);
      } catch {
        setError('Não foi possível criar a Tática. Tente novamente.');
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
          {isPending ? 'Criando...' : 'Criar Tática'}
        </Button>
      </div>
    </form>
  );
}
