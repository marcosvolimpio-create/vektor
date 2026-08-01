/**
 * AprendizadoService — RFC-005 (Aprendizado).
 *
 * Registra Aprendizado a partir de Evidência interpretada e implementa
 * "Evoluir Estratégia" (ADR-002): a ação, originada neste módulo, que
 * encerra a Estratégia ativa e cria a próxima. Este Service nunca escreve em
 * `strategies` diretamente — toda mutação passa por `EstrategiaEvolucaoPort`
 * (`shared/ports.ts`), que em runtime é `EstrategiaService`, composto pelo
 * Composition Root. Isso evita dependência direta entre Services mantendo
 * `EstrategiaService` como o único escritor de `strategies`.
 *
 * ADR-012: `evoluirEstrategia` é a única operação deste Service que exige
 * `role = 'admin'`. `registrarAprendizado` é permitido a qualquer Membro
 * `ativo` — ADR-012 já resolve isso explicitamente ("registrar conteúdo de
 * Aprendizado | membro, qualquer papel").
 */
import {
  EvidencesRepository,
  LearningsRepository,
  type DbClient,
  type Learning,
  type ListOptions,
  type PaginatedResult,
  type Strategy,
} from '@vektor/db';
import { assertAdmin, assertAindaAdmin, type ActorContext } from '../shared/actor-context';
import { NaoEncontradoError } from '../shared/errors';
import type { EstrategiaEvolucaoFactory, MembersRepositoryFactory } from '../shared/ports';

export interface RegistrarAprendizadoInput {
  content: unknown;
}

export class AprendizadoService {
  constructor(
    private readonly db: DbClient,
    private readonly estrategiaEvolucaoFactory: EstrategiaEvolucaoFactory,
    private readonly membersRepositoryFactory: MembersRepositoryFactory,
  ) {}

  /** RFC-005 critério nº1: toda entrada de Aprendizado carrega a Evidência que a originou. */
  async registrarAprendizado(
    actor: Pick<ActorContext, 'workspaceId' | 'memberId'>,
    evidenceId: string,
    input: RegistrarAprendizadoInput,
  ): Promise<Learning> {
    return this.db.transaction(async (tx) => {
      const evidencesRepository = new EvidencesRepository(tx);
      const evidence = await evidencesRepository.findById(actor.workspaceId, evidenceId);
      if (!evidence) {
        throw new NaoEncontradoError('Evidência', evidenceId);
      }
      const learningsRepository = new LearningsRepository(tx);
      return learningsRepository.create({
        workspaceId: actor.workspaceId,
        evidenceId: evidence.id,
        content: input.content,
        createdBy: actor.memberId,
      });
    });
  }

  async listarAprendizados(
    actor: Pick<ActorContext, 'workspaceId'>,
    evidenceId?: string,
    options?: ListOptions,
  ): Promise<PaginatedResult<Learning>> {
    const learningsRepository = new LearningsRepository(this.db);
    if (evidenceId) {
      return learningsRepository.findByEvidence(actor.workspaceId, evidenceId, options);
    }
    return learningsRepository.findByWorkspace(actor.workspaceId, options);
  }

  async obterAprendizado(
    actor: Pick<ActorContext, 'workspaceId'>,
    learningId: string,
    dbClient: DbClient = this.db,
  ): Promise<Learning> {
    const learningsRepository = new LearningsRepository(dbClient);
    const learning = await learningsRepository.findById(actor.workspaceId, learningId);
    if (!learning) {
      throw new NaoEncontradoError('Aprendizado', learningId);
    }
    return learning;
  }

  /**
   * ADR-002/RFC-005: "Evoluir Estratégia" — transação única que encerra a
   * Estratégia ativa (`EstrategiaEvolucaoPort.encerrarEstrategia`) e cria a
   * próxima (`EstrategiaEvolucaoPort.iniciarFormulacao`, com
   * `evolvedFromStrategyId`). ADR-012 exige `role = 'admin'`; `assertAdmin`
   * falha rápido a partir do `ActorContext` já resolvido, `assertAindaAdmin`
   * (função compartilhada, `shared/actor-context.ts`) reconfirma contra a
   * linha real de `members` dentro da própria transação (ADR-014/A4).
   */
  async evoluirEstrategia(actor: ActorContext, currentStrategyId: string): Promise<Strategy> {
    assertAdmin(actor, 'evoluir Estratégia');

    return this.db.transaction(async (tx) => {
      await assertAindaAdmin(actor, this.membersRepositoryFactory, tx, 'evoluir Estratégia');

      const estrategia = this.estrategiaEvolucaoFactory(tx);
      await estrategia.encerrarEstrategia(actor, currentStrategyId);
      return estrategia.iniciarFormulacao(actor, { evolvedFromStrategyId: currentStrategyId });
    });
  }
}
