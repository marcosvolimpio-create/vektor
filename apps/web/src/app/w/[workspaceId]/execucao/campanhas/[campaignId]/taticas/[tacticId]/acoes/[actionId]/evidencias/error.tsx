'use client';

import { Button } from '@vektor/ui/button';
import { useEffect } from 'react';

interface EvidenciasErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function EvidenciasError({ error, reset }: EvidenciasErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-sm text-destructive">Não foi possível carregar as Evidências. Tente novamente.</p>
      <Button variant="outline" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  );
}
