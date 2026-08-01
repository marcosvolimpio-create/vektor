'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@vektor/ui/button';
import { aceitarRecomendacaoAction, descartarRecomendacaoAction } from '@/actions/execution-intelligence.actions';

interface RecommendationCardProps {
  workspaceId: string;
  recommendationId: string;
  priority: string;
  justification: string;
  suggestedAction: string;
  status: string;
}

const PRIORITY_LABELS: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  aceita: 'Aceita',
  executada: 'Executada',
  descartada: 'Descartada',
};

/**
 * "Aceitar" só muda o status da recomendação para `aceita` — nunca executa
 * nada no domínio (Campaigns/Tactics/Actions/Evidences/Objectives/
 * Experiments permanecem intocados). Escopo desta Sprint proíbe execução
 * automática.
 */
export function RecommendationCard({
  workspaceId,
  recommendationId,
  priority,
  justification,
  suggestedAction,
  status,
}: RecommendationCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAceitar() {
    setError(null);
    startTransition(async () => {
      try {
        await aceitarRecomendacaoAction(workspaceId, recommendationId);
        router.refresh();
      } catch {
        setError('Não foi possível aceitar a recomendação. Tente novamente.');
      }
    });
  }

  function handleDescartar() {
    setError(null);
    startTransition(async () => {
      try {
        await descartarRecomendacaoAction(workspaceId, recommendationId);
        router.refresh();
      } catch {
        setError('Não foi possível descartar a recomendação. Tente novamente.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase text-muted-foreground">
          Prioridade {PRIORITY_LABELS[priority] ?? priority}
        </span>
        <span className="text-xs text-muted-foreground">{STATUS_LABELS[status] ?? status}</span>
      </div>

      <p className="text-sm">{justification}</p>
      <p className="text-sm font-medium text-muted-foreground">Ação sugerida: {suggestedAction}</p>

      {status === 'pendente' && (
        <div className="flex gap-2">
          <Button onClick={handleAceitar} disabled={isPending}>
            {isPending ? 'Processando...' : 'Aceitar'}
          </Button>
          <Button variant="outline" onClick={handleDescartar} disabled={isPending}>
            Ignorar
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
