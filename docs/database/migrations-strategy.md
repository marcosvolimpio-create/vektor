# Estratégia de Migrations

> Parte do [Modelo de Dados VEKTOR](./README.md). Descreve o processo — não contém migrations reais, conforme escopo desta modelagem. Ferramenta: Drizzle Kit (CLAUDE.md, ORM).

## Princípio geral

Migrations são sempre aditivas por padrão. Nenhuma migration remove uma coluna ou tabela em produção sem um período de depreciação — nenhuma fonte de produto exige isso, é disciplina de engenharia padrão para evitar perda de dado irreversível, coerente com a postura geral da VEKTOR de nunca descartar registro histórico (RFC-004/005: Evidência e Aprendizado nunca são apagados).

## Resolução da dependência circular `evidences` ↔ `experiments` ↔ `hypotheses`

Esta é a única dependência não-linear do modelo (ver diagrama em [`README.md`](./README.md)). Sequência de migrations para resolvê-la sem violar integridade referencial em nenhum momento:

1. **Migration N:** cria `evidences` com a coluna `experiment_id uuid` presente, **sem** a constraint de chave estrangeira (a tabela `experiments` ainda não existe neste ponto).
2. **Migration N+1:** cria `hypotheses` (depende apenas de `evidences`, que já existe).
3. **Migration N+2:** cria `experiments` (depende de `hypotheses`, `strategy_objectives`, `tactics`, `actions` — todas já existentes).
4. **Migration N+3:** adiciona a constraint pendente — `alter table evidences add constraint evidences_experiment_id_fkey foreign key (experiment_id) references experiments(id) on delete cascade`.

Nenhuma linha é gravada em `evidences.experiment_id` entre os passos 1 e 4 (a tabela está vazia nesse intervalo, por ser uma migration inicial) — não há risco de dado órfão durante a janela sem constraint.

## Alinhamento com as fases do Implementation Plan

Cada grupo de migrations corresponde a uma fase já sequenciada em [`implementation-plan.md`](../implementation-plan.md) — migrations não são escritas fora de ordem em relação às fases:

| Migration (grupo) | Tabelas | Fase do Implementation Plan | Pré-requisito de produto |
|---|---|---|---|
| 1 | `workspaces`, `members` | Fase 0 → Fase 1 | ✅ Bloqueador 1 ratificado (ADR-011, `DECISIONS.md`) |
| 2 | `strategies`, `strategy_steps`, `strategy_objectives` | Fase 1 → Fase 2 | ✅ ambiguidade da RFC-001 sobre "quando a Estratégia se torna ativa" confirmada (ADR-015) |
| 3 | `campaigns`, `tactics`, `actions` | Fase 3 | 🚧 Bloqueador 2 resolvido (ou aceito explicitamente que nenhuma coluna de status adicional será criada nesta migration) — permanece aberto |
| 4 | `evidences` (sem constraint), `hypotheses`, `experiments`, alteração de `evidences` | Fase 4 | ✅ Bloqueador 3 resolvido (ADR-012: Membro `role = 'admin'` aprova); coluna `approved_by` pode aceitar escrita real assim que a FK para `members.id` existir — depende apenas de a Migration 1 já ter criado a tabela |
| 5 | `learnings` | Fase 5 | nenhum bloqueador pendente |
| 6 | `integrations` | Fase 9 | nenhum bloqueador pendente |

## Checklist pré-migration (por PR)

- [ ] A migration corresponde a uma fase já alcançada no Implementation Plan — nunca adianta uma tabela de uma fase futura.
- [ ] Se a migration toca `campaigns`/`tactics` para adicionar uma coluna de status: o Bloqueador 2 foi resolvido em Review (não apenas por um ADR de conveniência — ver a revisão crítica já registrada sobre esse risco).
- [ ] Se a migration torna `experiments.approved_by` obrigatório ou restringe seus valores possíveis: a FK composta para `members.id` foi adicionada (Bloqueador 3 já resolvido por ADR-012 — falta apenas a ligação de schema).
- [ ] A política de RLS correspondente é criada na mesma migration que a tabela — nunca depois.
- [ ] Toda nova FK de posse usa `on delete cascade`; toda nova FK de referência usa `on delete restrict` (ver `physical-model.md`).
- [ ] Testado localmente contra uma cópia de schema com dado de exemplo antes de aplicar em staging.

## Rollback

Migrations aditivas (nova tabela, nova coluna nullable, novo enum) não precisam de rollback formal — remover a migration seguinte é suficiente. Migrations que alteram uma coluna existente (ex.: tornar `approved_by` `not null` agora que o Bloqueador 3 está resolvido, ADR-012) seguem o padrão *expand → migrate → contract*: adicionar a nova regra como nullable primeiro, popular/validar dado existente, só então aplicar a constraint restritiva em uma migration separada — nunca em um único passo que possa falhar parcialmente em produção.
