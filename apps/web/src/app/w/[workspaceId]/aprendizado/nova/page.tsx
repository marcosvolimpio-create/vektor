import { LearningForm } from '@/components/aprendizado/learning-form';

interface NovoAprendizadoPageProps {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ evidenceId?: string }>;
}

/**
 * Registro de Aprendizado (RFC-005, critério nº1) — sempre a partir de uma
 * Evidência específica, informada via `?evidenceId=`. O ponto de entrada é o
 * link "Registrar Aprendizado" na página de detalhe de Evidência (Execução).
 */
export default async function NovoAprendizadoPage({ params, searchParams }: NovoAprendizadoPageProps) {
  const { workspaceId } = await params;
  const { evidenceId } = await searchParams;

  return (
    <div className="flex max-w-md flex-col gap-6">
      <h1 className="text-2xl font-semibold">Registrar Aprendizado</h1>

      {!evidenceId ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma Evidência selecionada — acesse esta página a partir do detalhe de uma Evidência, em Execução.
        </p>
      ) : (
        <LearningForm workspaceId={workspaceId} evidenceId={evidenceId} />
      )}
    </div>
  );
}
