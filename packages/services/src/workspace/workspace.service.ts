import { WorkspacesRepository, type DbClient, type Workspace } from '@vektor/db';
import { listActiveMemberships } from '../shared/actor-context';
import { NaoEncontradoError } from '../shared/errors';
import type { Member, MemberRole, MembersRepositoryFactory } from '../shared/ports';

export interface CriarWorkspaceInput {
  /** `auth.uid()` resolvido no servidor (ADR-014) — nunca aceito como string arbitrária do cliente. */
  userId: string;
  /** E-mail do usuário autenticado, resolvido da sessão Supabase — vira o e-mail do Membro fundador. */
  email: string;
  workspaceName: string;
}

export interface CriarWorkspaceResult {
  workspace: Workspace;
  founder: Member;
}

/**
 * DTO de apresentação — não expõe a entidade `Workspace` (nem `Member`)
 * diretamente à UI. Contém apenas os campos que o Seletor de Workspace e o
 * Header realmente consomem; novos campos só entram aqui quando algum
 * consumidor real precisar deles.
 */
export interface WorkspaceDoUsuario {
  workspaceId: string;
  workspaceName: string;
  role: MemberRole;
}

/**
 * Workspace não é um módulo do Blueprint (Cap. 3.5) — não pertence a nenhuma
 * das 7 RFCs de módulo. Este Service é transversal, análogo em escopo a como
 * Dashboard existe sem ser módulo (ADR-001), e existe especificamente para
 * a responsabilidade que ADR-013 atribui a alguém: orquestrar a criação
 * self-service de um Workspace.
 */
export class WorkspaceService {
  constructor(
    private readonly db: DbClient,
    private readonly membersRepositoryFactory: MembersRepositoryFactory,
  ) {}

  /**
   * ADR-013: qualquer usuário autenticado cria um Workspace diretamente.
   * Na mesma transação, a linha de `workspaces` e a primeira linha de
   * `members` (o criador, `status = 'ativo'`, `role = 'admin'`) são
   * gravadas — nunca em passos separados, para que nunca exista um Workspace
   * sem nenhum Membro `admin`.
   */
  async criarWorkspace(input: CriarWorkspaceInput): Promise<CriarWorkspaceResult> {
    return this.db.transaction(async (tx) => {
      const workspacesRepository = new WorkspacesRepository(tx);
      const workspace = await workspacesRepository.create({ name: input.workspaceName });

      const membersRepository = this.membersRepositoryFactory(tx);
      const founder = await membersRepository.create({
        workspaceId: workspace.id,
        email: input.email,
        userId: input.userId,
        role: 'admin',
        status: 'ativo',
        joinedAt: new Date(),
        invitedBy: null,
      });

      return { workspace, founder };
    });
  }

  /**
   * RFC-008/ADR-014 (mesma base de `listActiveMemberships`): resolve os
   * Workspaces onde o usuário é Membro `ativo`, já com o nome de cada um —
   * necessário para o Seletor de Workspace e para o Header exibirem algo
   * além do UUID. Não é uma consulta escopada por `workspace_id` (é,
   * precisamente, a consulta que descobre a quais Workspaces o usuário
   * pertence), por isso não aceita `ActorContext` como entrada.
   */
  async listarWorkspacesDoUsuario(userId: string): Promise<WorkspaceDoUsuario[]> {
    const membersRepository = this.membersRepositoryFactory(this.db);
    const memberships = await listActiveMemberships(membersRepository, userId);
    const workspacesRepository = new WorkspacesRepository(this.db);

    return Promise.all(
      memberships.map(async (membership) => {
        const workspace = await workspacesRepository.findById(membership.workspaceId);
        if (!workspace) {
          throw new NaoEncontradoError('Workspace', membership.workspaceId);
        }
        return { workspaceId: workspace.id, workspaceName: workspace.name, role: membership.role };
      }),
    );
  }
}
