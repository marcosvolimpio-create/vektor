import type { ReactNode } from 'react';

interface DashboardEmptyStateProps {
  message: string;
  children?: ReactNode;
}

/** Estado vazio genérico e reutilizado por todos os blocos do Dashboard. */
export function DashboardEmptyState({ message, children }: DashboardEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
      <p>{message}</p>
      {children}
    </div>
  );
}
