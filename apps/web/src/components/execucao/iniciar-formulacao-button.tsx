'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@vektor/ui/button';
import { iniciarFormulacaoAction } from '@/actions/estrategia.actions';

interface IniciarFormulacaoButtonProps {
  workspaceId: string;
}

/**
 * Não é um dos seis arquivos nomeados no escopo, mas é necessário para o
 * "botão para criar Estratégia" do Empty State ser funcional, não decorativo
 * — mesmo padrão de botão de transição do Módulo 8 (`AprovarAcaoButton` etc.):
 * dispara a Server Action já existente e usa `router.refresh()` para que o
 * bloco "Estratégia Ativa" passe a exibi-la, sem navegar para nenhuma página
 * nova (não há UI do módulo Estratégia construída nesta Sprint).
 */
export function IniciarFormulacaoButton({ workspaceId }: IniciarFormulacaoButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await iniciarFormulacaoAction(workspaceId);
        router.refresh();
      } catch {
        setError('Não foi possível criar a Estratégia. Tente novamente.');
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? 'Criando...' : 'Criar Estratégia'}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
