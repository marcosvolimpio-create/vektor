import Link from 'next/link';
import { obterAcaoAction } from '@/actions/execucao.actions';
import { AprovarAcaoButton } from '@/components/execucao/aprovar-acao-button';
import { ConcluirAcaoForm } from '@/components/execucao/concluir-acao-form';
import { IniciarExecucaoButton } from '@/components/execucao/iniciar-execucao-button';

interface AcaoDetalhePageProps {
  params: Promise<{ workspaceId: string; campaignId: string; tacticId: string; actionId: string }>;
}

/** Rótulo de apresentação — não é regra de negócio, só tradução do enum já validado pelo Service. */
const STATUS_LABELS: Record<string, string> = {
  proposta: 'Proposta',
  aprovada: 'Aprovada',
  em_execucao: 'Em execução',
  concluida: 'Concluída',
  publicada: 'Publicada',
};

/**
 * Detalhe de Ação (RFC-002/RFC-004). Só exibe os próprios campos da Ação —
 * não lista Evidências inline: a listagem completa vive em
 * `/acoes/[actionId]/evidencias` (mesmo padrão de Tática em relação a
 * Ações, Módulo 6), evitando duplicar a mesma lógica de listagem em dois
 * lugares.
 *
 * Barra de ações dinâmica (Módulo 8): mapeia `acao.status` — já validado
 * inteiramente pelo Service — para qual dos três componentes de transição
 * renderizar. Nenhum estado é calculado além do necessário para essa
 * escolha de renderização.
 */
export default async function AcaoDetalhePage({ params }: AcaoDetalhePageProps) {
  const { workspaceId, campaignId, tacticId, actionId } = await params;
  const acao = await obterAcaoAction(workspaceId, actionId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={`/w/${workspaceId}/execucao/campanhas/${campaignId}/taticas/${tacticId}/acoes`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Ações
        </Link>
        <h1 className="text-2xl font-semibold">{acao.name}</h1>
      </div>

      <dl className="flex flex-col gap-4 text-sm">
        <div>
          <dt className="font-medium text-muted-foreground">Status</dt>
          <dd className="mt-1">{STATUS_LABELS[acao.status] ?? acao.status}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Descrição</dt>
          <dd className="mt-1">{acao.description ?? 'Sem descrição.'}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Criada em</dt>
          <dd className="mt-1">{acao.createdAt.toLocaleDateString('pt-BR')}</dd>
        </div>
      </dl>

      <div>
        {acao.status === 'proposta' && <AprovarAcaoButton workspaceId={workspaceId} actionId={actionId} />}
        {acao.status === 'aprovada' && <IniciarExecucaoButton workspaceId={workspaceId} actionId={actionId} />}
        {acao.status === 'em_execucao' && <ConcluirAcaoForm workspaceId={workspaceId} actionId={actionId} />}
        {acao.status === 'concluida' && <p className="text-sm text-muted-foreground">Ação concluída.</p>}
        {acao.status === 'publicada' && <p className="text-sm text-muted-foreground">Ação publicada.</p>}
      </div>

      <Link
        href={`/w/${workspaceId}/execucao/campanhas/${campaignId}/taticas/${tacticId}/acoes/${actionId}/evidencias`}
        className="block max-w-xs rounded-md border p-4 text-sm hover:bg-muted/50"
      >
        <span className="font-medium">Evidências</span>
        <p className="mt-1 text-muted-foreground">Ver e registrar Evidências desta Ação.</p>
      </Link>
    </div>
  );
}
