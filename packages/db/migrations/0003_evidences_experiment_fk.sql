-- F1 (Threat Modeling Review): consistência de workspace_id entre entidade
-- filha e entidade pai.
--
-- ANÁLISE TÉCNICA (feita antes de escrever qualquer trigger, como pedido):
-- toda FK deste schema já é composta (workspace_id, id) → (workspace_id, id)
-- na tabela pai (ADR-006/A6, ARCHITECTURE_RESOLUTION.md; ver migration
-- 0000_many_meteorite.sql). Uma FK composta desse tipo já torna
-- MATEMATICAMENTE IMPOSSÍVEL gravar uma linha filha com workspace_id
-- diferente do da entidade pai: para o par (workspace_id, parent_id) casar
-- com uma linha existente do pai, workspace_id precisa ser exatamente igual
-- ao workspace_id real daquele pai — não existe combinação que satisfaça a
-- FK com um workspace_id incorreto. Isso é uma garantia mais forte do que
-- um trigger (é imposta pelo próprio motor de integridade referencial do
-- Postgres, incondicionalmente, em toda INSERT/UPDATE), então adicionar um
-- trigger redundante em cima disso violaria a instrução explícita de não
-- duplicar regra de negócio desnecessariamente.
--
-- Conferido tabela a tabela (0000_many_meteorite.sql): actions, campaigns,
-- evidences (via action_id), experiments (hypothesis_id, objective_id,
-- tactic_id, action_id), hypotheses, learnings, strategies,
-- strategy_objectives, strategy_steps, tactics — todas já têm a FK composta
-- correta. `members.invited_by` (migration 0001) também.
--
-- ÚNICA LACUNA REAL ENCONTRADA: `evidences.experiment_id` nunca recebeu sua
-- FK composta — schema.ts já documentava isso como pendente (dependência
-- circular evidences ↔ experiments ↔ hypotheses, ver
-- docs/database/migrations-strategy.md, "Migration N+3"). Esta migration
-- executa exatamente esse passo já planejado — não é uma regra nova.
--> statement-breakpoint
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_experiment_id_fkey"
  FOREIGN KEY ("workspace_id", "experiment_id")
  REFERENCES "public"."experiments"("workspace_id", "id")
  ON DELETE cascade ON UPDATE no action;
