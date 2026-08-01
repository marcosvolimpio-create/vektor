import { describe, expect, it } from 'vitest';
import { FakeExecutionAdvisor } from './fake-execution-advisor';
import type { ExecutionContext } from './execution-context';

const AGORA = new Date('2026-08-01T00:00:00.000Z');

function diasAtras(dias: number): Date {
  return new Date(AGORA.getTime() - dias * 24 * 60 * 60 * 1000);
}

function baseContext(overrides: Partial<ExecutionContext> = {}): ExecutionContext {
  return {
    strategy: { id: 'strategy-1', status: 'ativa', createdAt: diasAtras(30) },
    objectives: [],
    campaigns: [],
    kpis: [],
    generatedAt: AGORA,
    ...overrides,
  };
}

describe('FakeExecutionAdvisor', () => {
  const advisor = new FakeExecutionAdvisor();

  it('não gera nenhuma recomendação para um contexto sem Campanhas nem Objetivos (ausência de campanhas)', () => {
    const recomendacoes = advisor.gerarRecomendacoes(baseContext());
    expect(recomendacoes).toHaveLength(0);
  });

  it('gera "campanha_sem_progresso" quando uma Campanha antiga não tem nenhuma Ação (ausência de ações)', () => {
    const context = baseContext({
      campaigns: [{ id: 'campaign-1', name: 'Campanha X', createdAt: diasAtras(20), tactics: [] }],
    });

    const recomendacoes = advisor.gerarRecomendacoes(context);

    expect(recomendacoes).toHaveLength(1);
    expect(recomendacoes[0]).toMatchObject({
      type: 'campanha_sem_progresso',
      suggestedAction: 'Criar novas ações.',
      dedupeKey: 'campanha_sem_progresso:campaign-1',
    });
  });

  it('NÃO gera "campanha_sem_progresso" para uma Campanha recente sem Ações ainda (dentro da janela de tolerância)', () => {
    const context = baseContext({
      campaigns: [{ id: 'campaign-1', name: 'Campanha Nova', createdAt: diasAtras(2), tactics: [] }],
    });

    expect(advisor.gerarRecomendacoes(context)).toHaveLength(0);
  });

  it('gera "acao_atrasada" para uma Ação em execução há mais de 7 dias', () => {
    const context = baseContext({
      campaigns: [
        {
          id: 'campaign-1',
          name: 'Campanha X',
          createdAt: diasAtras(20),
          tactics: [
            {
              id: 'tactic-1',
              name: 'Tática 1',
              actions: [
                {
                  id: 'action-1',
                  name: 'Ação atrasada',
                  status: 'em_execucao',
                  createdAt: diasAtras(10),
                  evidenceCount: 0,
                  hasRefutedHypothesis: false,
                },
              ],
            },
          ],
        },
      ],
    });

    const recomendacoes = advisor.gerarRecomendacoes(context);
    const atrasada = recomendacoes.find((r) => r.type === 'acao_atrasada');

    expect(atrasada).toMatchObject({
      suggestedAction: 'Reagendar a entrega.',
      dedupeKey: 'acao_atrasada:action-1',
    });
  });

  it('gera "muitas_acoes_abertas" quando uma Campanha tem mais de 10 Ações abertas', () => {
    const acoesAbertas = Array.from({ length: 11 }, (_, i) => ({
      id: `action-${i}`,
      name: `Ação ${i}`,
      status: 'proposta' as const,
      createdAt: diasAtras(1),
      evidenceCount: 0,
      hasRefutedHypothesis: false,
    }));

    const context = baseContext({
      campaigns: [
        {
          id: 'campaign-1',
          name: 'Campanha Cheia',
          createdAt: diasAtras(5),
          tactics: [{ id: 'tactic-1', name: 'Tática 1', actions: acoesAbertas }],
        },
      ],
    });

    const recomendacoes = advisor.gerarRecomendacoes(context);
    const muitas = recomendacoes.find((r) => r.type === 'muitas_acoes_abertas');

    expect(muitas).toMatchObject({
      suggestedAction: 'Priorizar entregas.',
      dedupeKey: 'muitas_acoes_abertas:campaign-1',
    });
  });

  it('gera "objetivo_sem_iniciativas" quando um Objetivo não tem nenhum Experimento', () => {
    const context = baseContext({
      objectives: [{ id: 'objective-1', description: 'Aumentar conversão', experimentCount: 0 }],
    });

    const recomendacoes = advisor.gerarRecomendacoes(context);

    expect(recomendacoes).toHaveLength(1);
    expect(recomendacoes[0]).toMatchObject({
      type: 'objetivo_sem_iniciativas',
      suggestedAction: 'Criar nova campanha.',
      dedupeKey: 'objetivo_sem_iniciativas:objective-1',
    });
  });

  it('NÃO gera "objetivo_sem_iniciativas" quando o Objetivo já tem Experimento', () => {
    const context = baseContext({
      objectives: [{ id: 'objective-1', description: 'Aumentar conversão', experimentCount: 2 }],
    });

    expect(advisor.gerarRecomendacoes(context)).toHaveLength(0);
  });

  it('gera "evidencia_negativa" quando a Ação tem uma Hipótese refutada associada', () => {
    const context = baseContext({
      campaigns: [
        {
          id: 'campaign-1',
          name: 'Campanha X',
          createdAt: diasAtras(5),
          tactics: [
            {
              id: 'tactic-1',
              name: 'Tática 1',
              actions: [
                {
                  id: 'action-1',
                  name: 'Ação com evidência ruim',
                  status: 'concluida',
                  createdAt: diasAtras(3),
                  evidenceCount: 1,
                  hasRefutedHypothesis: true,
                },
              ],
            },
          ],
        },
      ],
    });

    const recomendacoes = advisor.gerarRecomendacoes(context);
    const negativa = recomendacoes.find((r) => r.type === 'evidencia_negativa');

    expect(negativa).toMatchObject({
      suggestedAction: 'Revisar hipótese.',
      dedupeKey: 'evidencia_negativa:action-1',
    });
  });

  it('gera "kpi_abaixo_meta" quando um KPI está abaixo da meta (capacidade pronta para IA real futura)', () => {
    const context = baseContext({
      kpis: [{ nome: 'Taxa de conversão', meta: 10, atual: 4 }],
    });

    const recomendacoes = advisor.gerarRecomendacoes(context);

    expect(recomendacoes).toHaveLength(1);
    expect(recomendacoes[0]).toMatchObject({
      type: 'kpi_abaixo_meta',
      suggestedAction: 'Revisar estratégia de execução.',
      dedupeKey: 'kpi_abaixo_meta:Taxa de conversão',
    });
  });

  it('NÃO gera "kpi_abaixo_meta" quando o KPI está na meta ou acima', () => {
    const context = baseContext({
      kpis: [{ nome: 'Taxa de conversão', meta: 10, atual: 12 }],
    });

    expect(advisor.gerarRecomendacoes(context)).toHaveLength(0);
  });
});
