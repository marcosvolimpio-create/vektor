import type { ComponentProps } from "react";

import { cn } from "../lib/utils";

/**
 * `<select>` nativo — sem dependência de Radix. `@vektor/ui` não tem nenhuma
 * dependência de Radix hoje (só `class-variance-authority`/`clsx`/
 * `tailwind-merge`/`lucide-react`); um Select do shadcn/ui real exigiria
 * `@radix-ui/react-select`, dependência nova que CLAUDE.md exige aprovar
 * antes de instalar. Mesmo estilo visual de `Input`, para não introduzir uma
 * segunda convenção de borda/foco no design system.
 */
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
