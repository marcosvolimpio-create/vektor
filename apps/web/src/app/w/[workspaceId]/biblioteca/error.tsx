'use client';

import { Button } from '@vektor/ui/button';
import { useEffect } from 'react';

interface BibliotecaErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BibliotecaError({ error, reset }: BibliotecaErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-sm text-destructive">Não foi possível carregar a Biblioteca. Tente novamente.</p>
      <Button variant="outline" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  );
}
