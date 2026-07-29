import { HypothesisForm } from '@/components/growth/hypothesis-form';

interface NovaHipotesePageProps {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ evidenceId?: string }>;
}

/**
 * Registro de Hipótese (RFC-003, critério nº1) — sempre a partir de uma
 * Evidência específica, informada via `?evidenceId=`. O ponto de entrada é o
 * link "Criar Hipótese a partir desta Evidência" na página de detalhe de
 * Evidência (Execução).
 */
export default async function NovaHipotesePage({ params, searchParams }: NovaHipotesePageProps) {
  const { workspaceId } = await params;
  const { evidenceId } = await searchParams;

  return (
    <div className="flex max-w-md flex-col gap-6">
      <h1 className="text-2xl font-semibold">Registrar Hipótese</h1>

      {!evidenceId ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma Evidência selecionada — acesse esta página a partir do detalhe de uma Evidência, em Execução.
        </p>
      ) : (
        <HypothesisForm workspaceId={workspaceId} evidenceId={evidenceId} />
      )}
    </div>
  );
}
