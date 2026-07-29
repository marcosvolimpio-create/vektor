import { createSupabaseServerClient } from '@vektor/auth';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Rotas do próprio fluxo de autenticação Supabase — únicas exceções à
 * proteção por padrão. Nomes provisórios: `docs/implementation/frontend/routing.md`
 * ainda não decide a estrutura real de rotas (fora do escopo desta etapa).
 */
const PUBLIC_PATHS = ['/login', '/auth/callback'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Renova a sessão Supabase a cada requisição não excluída pelo matcher
 * (`config.matcher` abaixo) e bloqueia acesso a rotas protegidas sem sessão
 * válida. Não resolve `ActorContext`, não importa `@vektor/db` nem
 * `@vektor/services` — atua apenas no nível de sessão do Supabase Auth,
 * antes de qualquer Server Action ou Server Component rodar.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createSupabaseServerClient({
    getAll: () => request.cookies.getAll(),
    setAll: (cookiesToSet, headers) => {
      cookiesToSet.forEach(({ name, value }) => {
        request.cookies.set(name, value);
      });
      // Recria a response a partir do request já atualizado, para que os
      // cabeçalhos internos fiquem consistentes antes de anexar os cookies.
      response = NextResponse.next({ request });
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // Protege tudo por padrão; exclui apenas assets estáticos do Next e
  // arquivos de imagem/favicon — nunca o contrário (allowlist de rotas).
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
