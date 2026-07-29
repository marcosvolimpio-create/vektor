/**
 * Taxonomia de erro da camada Service — implementa `docs/implementation/api/errors.md`.
 *
 * Toda violação de invariante de negócio lança uma subclasse de `DomainError`,
 * nunca uma exceção genérica (`IMPLEMENTATION_STANDARDS.md`, Backend →
 * "Tratamento de erro"). Cada subclasse carrega `origin` — o ADR ou RFC que
 * justifica a regra — para que a camada de Server Action (próxima etapa)
 * possa mapear o erro para uma resposta ao usuário sem perder rastreabilidade.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly origin: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** ADR-012: Membro sem `role` suficiente para a operação solicitada. */
export class AutorizacaoInsuficienteError extends DomainError {
  readonly code = 'AUTORIZACAO_INSUFICIENTE';
  readonly origin = 'ADR-012';

  constructor(operation: string, requiredRole: string) {
    super(`Operação "${operation}" exige Membro com role = '${requiredRole}'.`);
  }
}

/**
 * A4 (`ARCHITECTURE_RESOLUTION.md`): Membro não encontrado no Workspace, ou
 * encontrado mas não `ativo` — revogação de acesso é checada a cada
 * requisição, nunca cacheada.
 */
export class AcessoNegadoError extends DomainError {
  readonly code = 'ACESSO_NEGADO';
  readonly origin = 'A4 (ARCHITECTURE_RESOLUTION.md)';

  constructor(userId: string, workspaceId: string) {
    super(`Usuário ${userId} não é Membro ativo do Workspace ${workspaceId}.`);
  }
}

/** Entidade não encontrada dentro do Workspace do ator — não é, por si, violação de regra de negócio. */
export class NaoEncontradoError extends DomainError {
  readonly code = 'NAO_ENCONTRADO';
  readonly origin = 'n/a';

  constructor(entity: string, id: string) {
    super(`${entity} ${id} não encontrado(a) neste Workspace.`);
  }
}

/** ADR-003: um Workspace nunca tem mais de uma Estratégia ativa simultaneamente. */
export class EstrategiaJaAtivaError extends DomainError {
  readonly code = 'ESTRATEGIA_JA_ATIVA';
  readonly origin = 'ADR-003';

  constructor(workspaceId: string) {
    super(`Workspace ${workspaceId} já possui uma Estratégia ativa.`);
  }
}

/** ADR-004: uma Estratégia encerrada nunca recebe nova Execução nem edição de sua formulação. */
export class EstrategiaEncerradaError extends DomainError {
  readonly code = 'ESTRATEGIA_ENCERRADA';
  readonly origin = 'ADR-004';

  constructor(strategyId: string) {
    super(`Estratégia ${strategyId} está encerrada e não aceita nova alteração.`);
  }
}

/** RFC-001, critério nº2: uma etapa não avança/aprova antes de suas dependências estarem aprovadas. */
export class EtapaForaDeOrdemError extends DomainError {
  readonly code = 'ETAPA_FORA_DE_ORDEM';
  readonly origin = 'RFC-001';

  constructor(stepType: string, missingDependency: string) {
    super(`Etapa "${stepType}" não pode avançar: dependência "${missingDependency}" ainda não foi aprovada.`);
  }
}

/** RFC-001: uma etapa sem conteúdo preenchido não pode ser aprovada. */
export class EtapaSemConteudoError extends DomainError {
  readonly code = 'ETAPA_SEM_CONTEUDO';
  readonly origin = 'RFC-001';

  constructor(stepType: string) {
    super(`Etapa "${stepType}" não tem conteúdo preenchido e não pode ser aprovada.`);
  }
}

/** ADR-011: `unique (workspace_id, email)` — já existe uma linha de Membro para este e-mail neste Workspace. */
export class ConviteJaExistenteError extends DomainError {
  readonly code = 'CONVITE_JA_EXISTENTE';
  readonly origin = 'ADR-011';

  constructor(email: string) {
    super(`Já existe um Membro (ativo, convidado ou removido) com o e-mail ${email} neste Workspace.`);
  }
}

/**
 * B5 (`ARCHITECTURE_RESOLUTION.md`): a escrita condicional não encontrou uma
 * linha no estado esperado — outra requisição já alterou o registro.
 */
export class TransicaoConcorrenteError extends DomainError {
  readonly code = 'TRANSICAO_CONCORRENTE';
  readonly origin = 'B5 (ARCHITECTURE_RESOLUTION.md)';

  constructor(entity: string, id: string) {
    super(`${entity} ${id} foi alterado(a) por outra requisição antes desta transição ser aplicada.`);
  }
}

/**
 * RFC-002 (evolução aprovada na Sprint de Execução, módulo Evidências):
 * `registrarEvidencia` só aceita uma Ação que já começou a ser executada —
 * uma Ação `proposta`/`aprovada` ainda não produziu nada a evidenciar.
 * Distinto de `TransicaoConcorrenteError`: aqui não há escrita condicional
 * disputada, é uma precondição de negócio verificada antes de escrever.
 */
export class AcaoNaoIniciadaError extends DomainError {
  readonly code = 'ACAO_NAO_INICIADA';
  readonly origin = 'RFC-002 (registrarEvidencia)';

  constructor(actionId: string) {
    super(`Ação ${actionId} ainda não foi iniciada — Evidência só pode ser registrada a partir do status 'em_execucao'.`);
  }
}

/**
 * RFC-004: uma Hipótese só entra em "Em teste" quando o Experimento que a
 * testa é aprovado — não é possível pular de `registrada` direto para
 * `em_teste`, nem aprovar um segundo Experimento para uma Hipótese que já
 * está `em_teste`/`validada`/`refutada`. Verificada em
 * `GrowthService.aprovarExperimento`, antes de qualquer escrita (RFC-003/004).
 */
export class HipoteseNaoPriorizadaError extends DomainError {
  readonly code = 'HIPOTESE_NAO_PRIORIZADA';
  readonly origin = 'RFC-004 (aprovarExperimento)';

  constructor(hypothesisId: string) {
    super(`Hipótese ${hypothesisId} não está no status 'priorizada' — Experimento não pode ser aprovado para ela agora.`);
  }
}
