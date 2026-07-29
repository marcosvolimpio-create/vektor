'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Rótulos dos segmentos estáticos conhecidos (`architecture/navigation.md`:
 * "Breadcrumb (Estratégia › Campanha › Tática)"). Segmentos dinâmicos
 * (`[campaignId]`, `[tacticId]`) ainda aparecem pelo próprio valor bruto da
 * URL — resolver o nome real da entidade (ex.: nome da Campanha) depende de
 * páginas que ainda não existem nesta Sprint (Módulos 8/9 em diante); não
 * antecipo esse dado aqui.
 */
const SEGMENT_LABELS: Record<string, string> = {
  estrategia: 'Estratégia',
  execucao: 'Execução',
  growth: 'Growth',
  aprendizado: 'Aprendizado',
  relatorios: 'Relatórios',
  campanhas: 'Campanhas',
  taticas: 'Táticas',
  acoes: 'Ações',
};

/** Deriva o rastro a partir da própria URL — nunca recebe dados de negócio via props. */
export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  // Descarta o prefixo estrutural `w/[workspaceId]` — o rastro começa no módulo.
  const trail = segments.slice(2);

  if (trail.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 border-b px-6 py-3 text-sm text-muted-foreground">
      {trail.map((segment, index) => {
        const href = `/${segments.slice(0, index + 3).join('/')}`;
        const isLast = index === trail.length - 1;
        const label = SEGMENT_LABELS[segment] ?? segment;

        return (
          <span key={href} className="flex items-center gap-1">
            {index > 0 && <span aria-hidden="true">›</span>}
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link href={href} className="hover:text-foreground">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
