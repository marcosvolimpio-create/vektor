'use server';

import { cookies } from 'next/headers';
import { signInWithPassword, signUpWithPassword } from '@vektor/auth';

type CookieAdapter = Parameters<typeof signInWithPassword>[0];

async function cookieAdapter(): Promise<CookieAdapter> {
  const cookieStore = await cookies();
  return {
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) => {
        cookieStore.set(name, value, options);
      });
    },
  };
}

export async function signInAction(email: string, password: string): Promise<void> {
  await signInWithPassword(await cookieAdapter(), { email, password });
}

export async function signUpAction(email: string, password: string): Promise<{ sessionCreated: boolean }> {
  return signUpWithPassword(await cookieAdapter(), { email, password });
}
