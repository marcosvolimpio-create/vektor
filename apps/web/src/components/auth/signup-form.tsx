'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { Button } from '@vektor/ui/button';
import { Input } from '@vektor/ui/input';
import { signUpAction } from '@/actions/auth.actions';

interface SignupFormProps {
  redirectTo?: string;
}

export function SignupForm({ redirectTo }: SignupFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmationNeeded, setConfirmationNeeded] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    startTransition(async () => {
      try {
        const { sessionCreated } = await signUpAction(email, password);
        if (sessionCreated) {
          router.push(redirectTo || '/');
          router.refresh();
        } else {
          setConfirmationNeeded(true);
        }
      } catch {
        setError('Não foi possível criar a conta. Verifique os dados e tente novamente.');
      }
    });
  }

  if (confirmationNeeded) {
    return (
      <p className="text-sm text-muted-foreground">
        Conta criada. Verifique seu e-mail para confirmar antes de entrar.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          E-mail
        </label>
        <Input id="email" name="email" type="email" required disabled={isPending} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Senha
        </label>
        <Input id="password" name="password" type="password" required minLength={6} disabled={isPending} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Criando conta...' : 'Criar conta'}
      </Button>

      <Link
        href={redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login'}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        Já tenho conta
      </Link>
    </form>
  );
}
