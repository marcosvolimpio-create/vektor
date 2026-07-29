'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  workspaceId: string;
}

/**
 * Navegação do Contexto Estratégico (`docs/implementation/frontend/routing.md`):
 * exatamente os módulos que vivem sob `/w/[workspaceId]/...` — Estratégia,
 * Execução, Growth, Aprendizado e a visão de Relatórios da Estratégia ativa.
 * Biblioteca e Configurações pertencem ao Contexto Global e não aparecem
 * aqui — teriam sua própria navegação, fora do escopo desta Sprint.
 *
 * Só marca destinos, não valida acesso a eles: um clique num módulo ainda
 * sem página construída resulta em 404 até o módulo correspondente ser
 * entregue — comportamento esperado de uma entrega incremental.
 */
const STRATEGIC_CONTEXT_NAV = [
  { slug: 'estrategia', label: 'Estratégia' },
  { slug: 'execucao', label: 'Execução' },
  { slug: 'growth', label: 'Growth' },
  { slug: 'aprendizado', label: 'Aprendizado' },
  { slug: 'relatorios', label: 'Relatórios' },
] as const;

export function Sidebar({ workspaceId }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação do Workspace" className="flex w-56 shrink-0 flex-col gap-1 border-r p-4">
      {STRATEGIC_CONTEXT_NAV.map((item) => {
        const href = `/w/${workspaceId}/${item.slug}`;
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={item.slug}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={
              isActive
                ? 'rounded-md bg-muted px-3 py-2 text-sm font-medium text-foreground'
                : 'rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50'
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
