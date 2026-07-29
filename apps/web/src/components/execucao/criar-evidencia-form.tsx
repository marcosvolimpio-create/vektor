'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { Button } from '@vektor/ui/button';
import { Textarea } from '@vektor/ui/textarea';
import { criarEvidenciaAction } from '@/actions/execucao.actions';

interface CriarEvidenciaFormProps {
  workspaceId: string;
  campaignId: string;
  tacticId: string;
  actionId: string;
}

/**
 * Único ponto que chama `criarEvidenciaAction` — mesmo padrão dos demais
 * formulários de criação. Não valida o status da Ação aqui: se a Ação ainda
 * não foi iniciada, `ExecucaoService.registrarEvidencia` lança
 * `AcaoNaoIniciadaError`, exibido como a mesma mensagem genérica de erro —
 * duplicar essa checagem na UI violaria "não criar regras de negócio na UI".
 */
export function CriarEvidenciaForm({ workspaceId, campaignId, tacticId, actionId }: CriarEvidenciaFormProps) {
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
        const evidencia = await criarEvidenciaAction(workspaceId, actionId, { content });
        router.push(
          `/w/${workspaceId}/execucao/campanhas/${campaignId}/taticas/${tacticId}/acoes/${actionId}/evidencias/${evidencia.id}`,
        );
      } catch {
        setError('Não foi possível registrar a Evidência. Tente novamente.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="content" className="text-sm font-medium">
          Conteúdo
        </label>
        <Textarea id="content" name="content" required disabled={isPending} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Registrando...' : 'Registrar Evidência'}
        </Button>
      </div>
    </form>
  );
}
