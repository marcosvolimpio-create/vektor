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
