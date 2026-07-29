'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import type { Action, StrategyObjective, Tactic } from '@vektor/db';
import { Button } from '@vektor/ui/button';
import { Select } from '@vektor/ui/select';
import { proporExperimentoAction } from '@/actions/growth.actions';

interface ExperimentFormProps {
  workspaceId: string;
  hypothesisId: string;
  objectives: StrategyObjective[];
  tactics: Tactic[];
  actions: Action[];
}

/**
 * Único ponto que chama `proporExperimentoAction`. A posse polimórfica
 * (Tática XOR Ação, `experiments_exactly_one_owner_check`) é resolvida num
 * único `<select>` cujo valor codifica o tipo (`tactic:<id>`/`action:<id>`)
 * — evita um segundo controle (radio) só para escolher o tipo. A dupla
 * amarração (Hipótese + Objetivo da Estratégia ativa) é validada
 * inteiramente por `GrowthService.proporExperimento` (RFC-003); este
 * componente não duplica essa checagem.
 */
export function ExperimentForm({ workspaceId, hypothesisId, objectives, tactics, actions }: ExperimentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const objectiveId = String(formData.get('objectiveId') ?? '');
    const owner = String(formData.get('owner') ?? '');
    const [ownerType, ownerId] = owner.split(':');

    if (!objectiveId || !ownerId || (ownerType !== 'tactic' && ownerType !== 'action')) {
      setError('Selecione um Objetivo e uma Tática ou Ação.');
      return;
    }

    startTransition(async () => {
      try {
        const input =
          ownerType === 'tactic'
            ? { hypothesisId, objectiveId, tacticId: ownerId }
            : { hypothesisId, objectiveId, actionId: ownerId };
        const experimento = await proporExperimentoAction(workspaceId, input);
        router.push(`/w/${workspaceId}/growth/hipoteses/${hypothesisId}/experimentos/${experimento.id}`);
      } catch {
        setError('Não foi possível propor o Experimento. Tente novamente.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="objectiveId" className="text-sm font-medium">
          Objetivo da Estratégia ativa
        </label>
        <Select id="objectiveId" name="objectiveId" required disabled={isPending} defaultValue="">
          <option value="" disabled>
            Selecione um Objetivo
          </option>
          {objectives.map((objective) => (
            <option key={objective.id} value={objective.id}>
              {objective.description}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="owner" className="text-sm font-medium">
          Roda dentro de
        </label>
        <Select id="owner" name="owner" required disabled={isPending} defaultValue="">
          <option value="" disabled>
            Selecione uma Tática ou Ação
          </option>
          {tactics.map((tactic) => (
            <option key={`tactic:${tactic.id}`} value={`tactic:${tactic.id}`}>
              Tática — {tactic.name}
            </option>
          ))}
          {actions.map((action) => (
            <option key={`action:${action.id}`} value={`action:${action.id}`}>
              Ação — {action.name}
            </option>
          ))}
        </Select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Propondo...' : 'Propor Experimento'}
        </Button>
      </div>
    </form>
  );
}
