import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExecutionRecommendation, PaginatedResult } from '@vektor/db';

let store: ExecutionRecommendation[] = [];
let idCounter = 0;

function emptyResult<T>(): PaginatedResult<T> {
  return { items: [], total: 0, limit: 100, offset: 0 };
}

/**
 * Sprint 4 — as 7 Repositories usadas por `construirContexto` são
 * substituídas por um fake que sempre retorna vazio: o advisor injetado no
 * teste é "roteirizado" (não é `FakeExecutionAdvisor` real) e ignora o
 * conteúdo do `ExecutionContext`, então o conteúdo dessas 7 tabelas é
 * irrelevante aqui — só `ExecutionRecommendationsRepository` precisa de um
 * fake com comportamento real (em memória) para testar dedupe/aceitar/descartar.
 */
class EmptyContextRepository {
  async findByStrategy() {
    return emptyResult();
  }
  async findByCampaign() {
    return emptyResult();
  }
  async findByTactic() {
    return emptyResult();
  }
  async findByAction() {
    return emptyResult();
  }
  async findByObjective() {
    return emptyResult();
  }
  async findByEvidence() {
    return emptyResult();
  }
}

class FakeExecutionRecommendationsRepository {
  async create(input: Omit<ExecutionRecommendation, 'id' | 'createdAt' | 'updatedAt'>) {
    // O schema real usa `.default('pendente')` no Postgres; este fake em
    // memória não tem default de banco, então reproduz o mesmo
    // comportamento explicitamente aqui.
    const row = {
      ...input,
      status: input.status ?? 'pendente',
      id: `rec-${++idCounter}`,
      createdAt: new Date(),
      updatedAt: null,
    } as ExecutionRecommendation;
    store.push(row);
    return row;
  }

  async findById(workspaceId: string, id: string) {
    return store.find((row) => row.workspaceId === workspaceId && row.id === id);
  }

  async findPendingByDedupeKey(workspaceId: string, dedupeKey: string) {
    return store.find(
      (row) => row.workspaceId === workspaceId && row.dedupeKey === dedupeKey && row.status === 'pendente',
    );
  }

  async findByStrategy(workspaceId: string, strategyId: string): Promise<PaginatedResult<ExecutionRecommendation>> {
    const items = store.filter((row) => row.workspaceId === workspaceId && row.strategyId === strategyId);
    return { items, total: items.length, limit: 100, offset: 0 };
  }

  async update(
    workspaceId: string,
    id: string,
    patch: Partial<ExecutionRecommendation>,
    expectedStatus?: ExecutionRecommendation['status'],
  ) {
    const row = store.find((item) => item.workspaceId === workspaceId && item.id === id);
    if (!row) return undefined;
    if (expectedStatus && row.status !== expectedStatus) return undefined;
    Object.assign(row, patch);
    return row;
  }

  async count(workspaceId: string) {
    return store.filter((row) => row.workspaceId === workspaceId).length;
  }
}

vi.mock('@vektor/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vektor/db')>();
  return {
    ...actual,
    StrategyObjectivesRepository: EmptyContextRepository,
    CampaignsRepository: EmptyContextRepository,
    TacticsRepository: EmptyContextRepository,
    ActionsRepository: EmptyContextRepository,
    EvidencesRepository: EmptyContextRepository,
    ExperimentsRepository: EmptyContextRepository,
    HypothesesRepository: EmptyContextRepository,
    ExecutionRecommendationsRepository: FakeExecutionRecommendationsRepository,
  };
});

const { ExecutionIntelligenceService } = await import('./execution-intelligence.service');
type EstrategiaServiceType = import('../estrategia/estrategia.service').EstrategiaService;
type ActorContextType = import('../shared/actor-context').ActorContext;
type ExecutionAdvisorAIType = import('./ports').ExecutionAdvisorAI;
type RecommendationDraftType = import('./recommendation').RecommendationDraft;
type DbClientType = import('@vektor/db').DbClient;

const ACTOR: ActorContextType = { workspaceId: 'workspace-1', memberId: 'member-1', role: 'membro' };

function fakeEstrategiaService(): EstrategiaServiceType {
  return {
    garantirEstrategiaAtiva: async () => ({
      id: 'strategy-1',
      workspaceId: 'workspace-1',
      status: 'ativa',
      evolvedFromStrategyId: null,
      createdAt: new Date(),
    }),
  } as unknown as EstrategiaServiceType;
}

function scriptedAdvisor(drafts: RecommendationDraftType[]): ExecutionAdvisorAIType {
  return { gerarRecomendacoes: () => drafts };
}

const fakeDb = {
  transaction: async <T>(callback: (tx: unknown) => Promise<T>) => callback({}),
} as unknown as DbClientType;

const DRAFT: RecommendationDraftType = {
  type: 'campanha_sem_progresso',
  priority: 'media',
  justification: 'Campanha parada.',
  context: { campaignId: 'campaign-1' },
  suggestedAction: 'Criar novas ações.',
  dedupeKey: 'campanha_sem_progresso:campaign-1',
};

describe('ExecutionIntelligenceService', () => {
  beforeEach(() => {
    store = [];
    idCounter = 0;
  });

  it('persiste uma nova recomendação gerada pelo advisor', async () => {
    const service = new ExecutionIntelligenceService(fakeDb, fakeEstrategiaService(), scriptedAdvisor([DRAFT]));
    const recomendacoes = await service.analisarExecucao(ACTOR, 'strategy-1');

    expect(recomendacoes).toHaveLength(1);
    expect(recomendacoes[0]).toMatchObject({ type: 'campanha_sem_progresso', status: 'pendente' });
  });

  it('não duplica uma recomendação pendente já existente para a mesma causa (recomendação duplicada)', async () => {
    const service = new ExecutionIntelligenceService(fakeDb, fakeEstrategiaService(), scriptedAdvisor([DRAFT]));

    await service.analisarExecucao(ACTOR, 'strategy-1');
    const segunda = await service.analisarExecucao(ACTOR, 'strategy-1');

    expect(segunda).toHaveLength(1);
    expect(store).toHaveLength(1);
  });

  it('aceita uma recomendação pendente (Pendente → Aceita)', async () => {
    const service = new ExecutionIntelligenceService(fakeDb, fakeEstrategiaService(), scriptedAdvisor([DRAFT]));
    const [recomendacao] = await service.analisarExecucao(ACTOR, 'strategy-1');
    if (!recomendacao) throw new Error('recomendação não criada');

    const aceita = await service.aceitarRecomendacao(ACTOR, recomendacao.id);

    expect(aceita.status).toBe('aceita');
  });

  it('descarta uma recomendação pendente (Pendente → Descartada)', async () => {
    const service = new ExecutionIntelligenceService(fakeDb, fakeEstrategiaService(), scriptedAdvisor([DRAFT]));
    const [recomendacao] = await service.analisarExecucao(ACTOR, 'strategy-1');
    if (!recomendacao) throw new Error('recomendação não criada');

    const descartada = await service.descartarRecomendacao(ACTOR, recomendacao.id);

    expect(descartada.status).toBe('descartada');
  });

  it('lança erro ao tentar aceitar uma recomendação que já foi processada', async () => {
    const service = new ExecutionIntelligenceService(fakeDb, fakeEstrategiaService(), scriptedAdvisor([DRAFT]));
    const [recomendacao] = await service.analisarExecucao(ACTOR, 'strategy-1');
    if (!recomendacao) throw new Error('recomendação não criada');

    await service.descartarRecomendacao(ACTOR, recomendacao.id);

    await expect(service.aceitarRecomendacao(ACTOR, recomendacao.id)).rejects.toThrow();
  });
});
