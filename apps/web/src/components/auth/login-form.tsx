'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { Button } from '@vektor/ui/button';
import { Input } from '@vektor/ui/input';
import { signInAction } from '@/actions/auth.actions';

interface LoginFormProps {
  redirectTo?: string;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    startTransition(async () => {
      try {
        await signInAction(email, password);
        router.push(redirectTo || '/');
        router.refresh();
      } catch {
        setError('Não foi possível entrar. Verifique seu e-mail e senha.');
      }
    });
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
        <Input id="password" name="password" type="password" required disabled={isPending} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Entrando...' : 'Entrar'}
      </Button>

      <Link
        href={redirectTo ? `/cadastro?redirectTo=${encodeURIComponent(redirectTo)}` : '/cadastro'}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        Criar conta
      </Link>
    </form>
  );
}
