'use client';

import { Button } from '@vektor/ui/button';
import { useEffect } from 'react';

interface EvidenciaDetalheErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function EvidenciaDetalheError({ error, reset }: EvidenciaDetalheErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-sm text-destructive">Não foi possível carregar esta Evidência. Tente novamente.</p>
      <Button variant="outline" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  );
}
