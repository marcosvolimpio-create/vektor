# Estratégia de Versionamento do Banco

> Parte do [Modelo de Dados VEKTOR](./README.md).

## Fonte única de verdade sobre a versão do schema

O diretório de migrations do Drizzle Kit (`drizzle/meta/_journal.json` e os arquivos de migration numerados) é a única fonte de verdade sobre qual versão de schema está aplicada em cada ambiente — nenhum documento desta pasta tenta duplicar essa informação. `logical-model.md` descreve o estado-alvo conceitual; o journal descreve o que já foi de fato aplicado.

## Numeração e rastreabilidade

Cada migration gerada pelo Drizzle Kit já recebe um timestamp/sequência própria. Adicional a isso, cada migration é anotada (na mensagem de commit do PR que a introduz, não no arquivo gerado, que não deve ser editado manualmente) com:

- a fase do Implementation Plan a que pertence;
- a(s) RFC(s)/ADR(s) de origem das tabelas/colunas que introduz;
- se resolve, parcial ou totalmente, algum dos três bloqueadores pendentes (1, 2 ou 3).

Isso permite reconstruir, a qualquer momento, por que uma coluna existe, sem depender de memória de equipe.

## Ambientes e sincronização

Um único schema lógico é compartilhado por todos os Workspaces (multi-tenant via RLS, não multi-schema, não multi-banco) — ver `physical-model.md` e `docs/implementation/database/rls.md`. Cada ambiente (`docs/implementation/deployment/environments.md`: dev, staging, produção) roda a mesma sequência de migrations, na mesma ordem, sem divergência — nunca uma migration aplicada só em um ambiente.

## Mudanças de schema após a v1 (evolução)

Toda mudança de schema depois que uma fase do Implementation Plan for concluída segue a mesma disciplina *expand → migrate → contract* de `migrations-strategy.md`, com uma regra adicional específica de versionamento: nenhuma migration que resolva um dos três bloqueadores pendentes pode ser silenciosa — precisa referenciar, no mesmo PR, o ADR ou a atualização de RFC que formalizou a decisão em `DECISIONS.md`. Uma migration de schema nunca é, ela própria, o lugar onde uma decisão de produto é tomada.

## Compatibilidade com a Fase 2 do Roadmap (v2)

Nenhuma migration da v1 deve ser desenhada de forma que a Fase 2 do Roadmap (Blueprint, Cap. 7 — "Marketing Intelligence", benchmarking entre ciclos, sempre agregado e nunca cruzando Workspace) exija reescrever o schema existente. Como o modelo já é multi-Estratégia por Workspace (`strategies.evolved_from_strategy_id` preserva a cadeia completa) e já isola por `workspace_id` em toda tabela, a evolução para v2 é aditiva por natureza — novas tabelas de agregação/benchmark, não alteração das tabelas atuais.
