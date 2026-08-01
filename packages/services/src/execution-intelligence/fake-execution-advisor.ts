import type { ActionContextItem, CampaignContextItem, ExecutionContext } from './execution-context';
import type { ExecutionAdvisorAI } from './ports';
import type { RecommendationDraft } from './recommendation';

const DIAS_ACAO_ATRASADA = 7;
const DIAS_CAMPANHA_SEM_PROGRESSO = 14;
const LIMITE_ACOES_ABERTAS = 10;
const STATUSES_ABERTOS: ReadonlyArray<ActionContextItem['status']> = ['proposta', 'aprovada', 'em_execucao'];

function diasDesde(data: Date, agora: Date): number {
  return Math.floor((agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Fake Provider (Sprint 4). Regras determinísticas, sem chamada a nenhum
 * provedor de IA externo — OpenAI/Claude/Gemini permanecem fora desta
 * Sprint (ver "Não implementar" do escopo). Implementa `ExecutionAdvisorAI`
 * para que a troca por um provedor real seja só uma nova classe + 1 linha
 * na Composition Root, sem tocar `ExecutionIntelligenceService`.
 *
 * `kpi_abaixo_meta` está implementado e testável, mas nunca dispara contra
 * dado real hoje: `ExecutionContext.kpis` é sempre `[]` na leitura real
 * (nenhuma tabela do domínio modela KPI — RFC-007). A regra existe pronta
 * para quando essa lacuna for resolvida.
 */
export class FakeExecutionAdvisor implements ExecutionAdvisorAI {
  gerarRecomendacoes(context: ExecutionContext): RecommendationDraft[] {
    const drafts: RecommendationDraft[] = [];

    for (const campaign of context.campaigns) {
      drafts.push(...this.analisarCampanha(campaign, context.generatedAt));
    }

    for (const objective of context.objectives) {
      if (objective.experimentCount === 0) {
        drafts.push({
          type: 'objetivo_sem_iniciativas',
          priority: 'media',
          justification: `O Objetivo "${objective.description}" não tem nenhum Experimento vinculado.`,
          context: { objectiveId: objective.id },
          suggestedAction: 'Criar nova campanha.',
          dedupeKey: `objetivo_sem_iniciativas:${objective.id}`,
        });
      }
    }

    for (const kpi of context.kpis) {
      if (kpi.atual < kpi.meta) {
        drafts.push({
          type: 'kpi_abaixo_meta',
          priority: 'alta',
          justification: `O indicador "${kpi.nome}" está abaixo da meta (${kpi.atual} de ${kpi.meta}).`,
          context: { kpi: kpi.nome, meta: kpi.meta, atual: kpi.atual },
          suggestedAction: 'Revisar estratégia de execução.',
          dedupeKey: `kpi_abaixo_meta:${kpi.nome}`,
        });
      }
    }

    return drafts;
  }

  private analisarCampanha(campaign: CampaignContextItem, agora: Date): RecommendationDraft[] {
    const drafts: RecommendationDraft[] = [];
    const todasAsAcoes = campaign.tactics.flatMap((tactic) => tactic.actions);
    const acoesAbertas = todasAsAcoes.filter((action) => STATUSES_ABERTOS.includes(action.status));

    if (todasAsAcoes.length === 0 && diasDesde(campaign.createdAt, agora) >= DIAS_CAMPANHA_SEM_PROGRESSO) {
      const dias = diasDesde(campaign.createdAt, agora);
      drafts.push({
        type: 'campanha_sem_progresso',
        priority: 'media',
        justification: `A Campanha "${campaign.name}" está parada há ${dias} dias, sem nenhuma Ação criada.`,
        context: { campaignId: campaign.id, dias },
        suggestedAction: 'Criar novas ações.',
        dedupeKey: `campanha_sem_progresso:${campaign.id}`,
      });
    }

    if (acoesAbertas.length > LIMITE_ACOES_ABERTAS) {
      drafts.push({
        type: 'muitas_acoes_abertas',
        priority: 'alta',
        justification: `A Campanha "${campaign.name}" tem ${acoesAbertas.length} Ações abertas simultaneamente.`,
        context: { campaignId: campaign.id, quantidade: acoesAbertas.length },
        suggestedAction: 'Priorizar entregas.',
        dedupeKey: `muitas_acoes_abertas:${campaign.id}`,
      });
    }

    for (const tactic of campaign.tactics) {
      for (const action of tactic.actions) {
        if (action.status === 'em_execucao' && diasDesde(action.createdAt, agora) >= DIAS_ACAO_ATRASADA) {
          const dias = diasDesde(action.createdAt, agora);
          drafts.push({
            type: 'acao_atrasada',
            priority: 'alta',
            justification: `A Ação "${action.name}" está em execução há ${dias} dias sem conclusão.`,
            context: { actionId: action.id, tacticId: tactic.id, campaignId: campaign.id, dias },
            suggestedAction: 'Reagendar a entrega.',
            dedupeKey: `acao_atrasada:${action.id}`,
          });
        }

        if (action.hasRefutedHypothesis) {
          drafts.push({
            type: 'evidencia_negativa',
            priority: 'alta',
            justification: `A Ação "${action.name}" produziu uma Evidência que refutou a Hipótese associada.`,
            context: { actionId: action.id, campaignId: campaign.id },
            suggestedAction: 'Revisar hipótese.',
            dedupeKey: `evidencia_negativa:${action.id}`,
          });
        }
      }
    }

    return drafts;
  }
}
