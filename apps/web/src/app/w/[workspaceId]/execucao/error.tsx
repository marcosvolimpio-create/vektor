'use client';

import { Button } from '@vektor/ui/button';
import { useEffect } from 'react';

interface ExecucaoErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary nativo do App Router para este segmento de rota — captura
 * qualquer exceção lançada pelas Server Actions chamadas em `page.tsx`
 * (ex.: `AcessoNegadoError`) durante a renderização no servidor. Não
 * interpreta o erro nem decide regra de negócio — apenas oferece "tentar
 * novamente" via `reset()`.
 */
export default function ExecucaoError({ error, reset }: ExecucaoErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-sm text-destructive">Não foi possível carregar Execução. Tente novamente.</p>
      <Button variant="outline" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  );
}
