import { Button } from "@vektor/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">VEKTOR</h1>
      <p className="text-muted-foreground">
        Fundação da Fase 1 — monorepo, design system e apps/web funcionando.
      </p>
      <Button>Fundação OK</Button>
    </main>
  );
}
