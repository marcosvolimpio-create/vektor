// Entry point público de @vektor/services — camada Service da VEKTOR.
// Toda regra de negócio, autorização (ADR-012) e orquestração transacional
// entre Repositories vive aqui. Nenhum Service acessa o Drizzle diretamente
// — apenas via as classes de `@vektor/db`.

export * from './shared/actor-context';
export * from './shared/errors';
export * from './shared/ports';

export * from './workspace/workspace.service';
export * from './estrategia/estrategia.service';
export * from './estrategia/step-dependencies';
export * from './configuracoes/configuracoes.service';
export * from './execucao/execucao.service';
export * from './growth/growth.service';
export * from './aprendizado/aprendizado.service';
