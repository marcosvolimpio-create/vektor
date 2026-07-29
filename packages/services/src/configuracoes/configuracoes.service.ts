import type { DbClient, ListOptions, PaginatedResult } from '@vektor/db';
import { assertAdmin, type ActorContext } from '../shared/actor-context';
import { ConviteJaExistenteError, NaoEncontradoError, TransicaoConcorrenteError } from '../shared/errors';
import type { Member, MemberRole, MembersRepositoryFactory } from '../shared/ports';

export interface AceitarConviteInput {
  /** `auth.uid()` resolvido no servidor (ADR-014). */
  userId: string;
  email: string;
  workspaceId: string;
}

/**
 * RFC-008 — fatia "Equipe" apenas (Fase 1, `implementation-plan.md`:
 * "convite de Membro... disponível desde a criação do Workspace, mesmo sem
 * uma Estratégia ativa"). As fatias "Permissões" (estrutura já fechada em
 * ADR-012, sem operação própria além do `role` gerenciado aqui) e
 * "Integrações" (Fase 9) não pertencem a esta Fase.
 *
 * Toda escrita abre sua própria transação — mesmo quando é uma única
 * chamada ao repositório — para que a leitura de checagem (ex.: e-mail já
 * convidado) e a escrita resultante rodem sempre contra o mesmo `DbClient`.
 */
export class ConfiguracoesService {
  constructor(
    private readonly db: DbClient,
    private readonly membersRepositoryFactory: MembersRepositoryFactory,
  ) {}

  /**
   * ADR-012: convidar Membro exige `role = 'admin'`. ADR-011:
   * `unique (workspace_id, email)` — um e-mail só pode ter uma linha de
   * Membro (em qualquer status) por Workspace.
   *
   * `role` do convidado é opcional e assume `'membro'` por padrão — nenhuma
   * fonte define quem escolhe o papel do convidado; `'membro'` é o menor
   * privilégio possível, consistente com "Security by default"
   * (`CLAUDE.md`, Architecture Principles).
   */
  async convidarMembro(actor: ActorContext, email: string, role: MemberRole = 'membro'): Promise<Member> {
    assertAdmin(actor, 'convidar Membro');

    return this.db.transaction(async (tx) => {
      const membersRepository = this.membersRepositoryFactory(tx);
      const existente = await membersRepository.findByEmail(actor.workspaceId, email);
      if (existente) {
        throw new ConviteJaExistenteError(email);
      }

      return membersRepository.create({
        workspaceId: actor.workspaceId,
        email,
        role,
        status: 'convidado',
        invitedBy: actor.memberId,
      });
    });
  }

  /**
   * Sem `ActorContext`: quem aceita ainda não é Membro `ativo` do Workspace
   * — é identificado pelo `userId`/`email` da própria sessão autenticada
   * (ADR-014) mais o Workspace do convite. Escrita condicional
   * (`expectedStatus: 'convidado'`) evita aceitar duas vezes o mesmo convite
   * em corrida (B5).
   */
  async aceitarConvite(input: AceitarConviteInput): Promise<Member> {
    return this.db.transaction(async (tx) => {
      const membersRepository = this.membersRepositoryFactory(tx);
      const convite = await membersRepository.findByEmail(input.workspaceId, input.email);
      if (!convite) {
        throw new NaoEncontradoError('Convite de Membro', input.email);
      }

      const aceito = await membersRepository.update(
        input.workspaceId,
        convite.id,
        { userId: input.userId, status: 'ativo', joinedAt: new Date() },
        'convidado',
      );
      if (!aceito) {
        throw new TransicaoConcorrenteError('Membro', convite.id);
      }
      return aceito;
    });
  }

  /** ADR-012: remover Membro exige `role = 'admin'`. Nunca exclusão física (Regra Absoluta nº8). */
  async removerMembro(actor: ActorContext, targetMemberId: string): Promise<Member> {
    assertAdmin(actor, 'remover Membro');

    return this.db.transaction(async (tx) => {
      const membersRepository = this.membersRepositoryFactory(tx);
      const alvo = await membersRepository.findById(actor.workspaceId, targetMemberId);
      if (!alvo) {
        throw new NaoEncontradoError('Membro', targetMemberId);
      }

      const removido = await membersRepository.update(
        actor.workspaceId,
        targetMemberId,
        { status: 'removido' },
        alvo.status,
      );
      if (!removido) {
        throw new TransicaoConcorrenteError('Membro', targetMemberId);
      }
      return removido;
    });
  }

  /** ADR-012: alterar `role` de outro Membro exige `role = 'admin'` no ator. */
  async alterarRole(actor: ActorContext, targetMemberId: string, newRole: MemberRole): Promise<Member> {
    assertAdmin(actor, 'alterar role de Membro');

    return this.db.transaction(async (tx) => {
      const membersRepository = this.membersRepositoryFactory(tx);
      const alvo = await membersRepository.findById(actor.workspaceId, targetMemberId);
      if (!alvo) {
        throw new NaoEncontradoError('Membro', targetMemberId);
      }

      const atualizado = await membersRepository.update(actor.workspaceId, targetMemberId, { role: newRole });
      if (!atualizado) {
        throw new NaoEncontradoError('Membro', targetMemberId);
      }
      return atualizado;
    });
  }

  /** Leitura — qualquer Membro `ativo` do Workspace, independentemente de `role`. */
  async listarMembros(
    actor: Pick<ActorContext, 'workspaceId'>,
    options?: ListOptions,
  ): Promise<PaginatedResult<Member>> {
    const membersRepository = this.membersRepositoryFactory(this.db);
    return membersRepository.findByWorkspace(actor.workspaceId, options);
  }
}
