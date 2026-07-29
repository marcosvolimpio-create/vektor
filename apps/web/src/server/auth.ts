import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@vektor/auth';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  /**
   * F3 (Threat Modeling Review): `true` somente quando o Supabase Auth
   * confirma `email_confirmed_at` preenchido. Campo aditivo — nenhum
   * chamador existente que ignore este campo tem seu comportamento alterado.
   */
  emailVerified: boolean;
}

/**
 * ADR-014: resolve a identidade autenticada (`auth.uid()`) a partir da
 * sessão Supabase da requisição atual — nunca de um valor enviado pelo
 * cliente. Chamada uma vez por Server Action, nunca cacheada entre
 * requisições (A4).
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) => {
        cookieStore.set(name, value, options);
      });
    },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || !data.user.email) {
    throw new Error('Requisição não autenticada.');
  }
  return {
    userId: data.user.id,
    email: data.user.email,
    emailVerified: data.user.email_confirmed_at != null,
  };
}
