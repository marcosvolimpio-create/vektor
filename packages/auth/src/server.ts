import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase para uso no servidor (Server Actions, Route Handlers).
 * O adaptador de cookies é injetado pelo chamador — este pacote não depende
 * de nenhum framework específico (ex.: `next/headers`); quem fornece o
 * adaptador concreto é a borda da aplicação (Composition Root, `apps/web`).
 */
export function createSupabaseServerClient(cookies: CookieMethodsServer): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY não definidas.');
  }
  return createServerClient(url, anonKey, { cookies });
}

export interface EmailPasswordCredentials {
  email: string;
  password: string;
}

/** Sprint 2 (onboarding): autentica e propaga a sessão via o mesmo adaptador de cookies do chamador. */
export async function signInWithPassword(
  cookies: CookieMethodsServer,
  credentials: EmailPasswordCredentials,
): Promise<void> {
  const supabase = createSupabaseServerClient(cookies);
  const { error } = await supabase.auth.signInWithPassword(credentials);
  if (error) {
    throw new Error('Credenciais inválidas.');
  }
}

/**
 * Sprint 2 (onboarding): cria a conta. `sessionCreated` é `false` quando o
 * projeto Supabase exige confirmação de e-mail antes de liberar sessão —
 * o chamador decide o que exibir em cada caso.
 */
export async function signUpWithPassword(
  cookies: CookieMethodsServer,
  credentials: EmailPasswordCredentials,
): Promise<{ sessionCreated: boolean }> {
  const supabase = createSupabaseServerClient(cookies);
  const { data, error } = await supabase.auth.signUp(credentials);
  if (error) {
    throw new Error('Não foi possível criar a conta.');
  }
  return { sessionCreated: data.session !== null };
}
