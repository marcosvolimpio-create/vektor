CREATE TYPE "public"."action_status" AS ENUM('proposta', 'aprovada', 'em_execucao', 'concluida', 'publicada');--> statement-breakpoint
CREATE TYPE "public"."campaign_origin" AS ENUM('handoff', 'manual');--> statement-breakpoint
CREATE TYPE "public"."experiment_status" AS ENUM('proposto', 'aprovado', 'em_execucao', 'concluido');--> statement-breakpoint
CREATE TYPE "public"."hypothesis_status" AS ENUM('registrada', 'priorizada', 'em_teste', 'validada', 'refutada');--> statement-breakpoint
CREATE TYPE "public"."strategy_status" AS ENUM('ativa', 'encerrada');--> statement-breakpoint
CREATE TYPE "public"."strategy_step_type" AS ENUM('diagnostico', 'mercado', 'concorrentes', 'swot', 'icp', 'personas', 'jornada_cliente', 'funis', 'objetivos', 'posicionamento', 'sintese');--> statement-breakpoint
CREATE TABLE "actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"tactic_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "action_status" DEFAULT 'proposta' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "actions_workspace_id_id_unique" UNIQUE("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"strategy_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"origin" "campaign_origin" NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_workspace_id_id_unique" UNIQUE("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "evidences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"action_id" uuid,
	"experiment_id" uuid,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evidences_workspace_id_id_unique" UNIQUE("workspace_id","id"),
	CONSTRAINT "evidences_exactly_one_origin_check" CHECK (num_nonnulls("evidences"."action_id", "evidences"."experiment_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "experiments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"hypothesis_id" uuid NOT NULL,
	"objective_id" uuid NOT NULL,
	"tactic_id" uuid,
	"action_id" uuid,
	"status" "experiment_status" DEFAULT 'proposto' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "experiments_workspace_id_id_unique" UNIQUE("workspace_id","id"),
	CONSTRAINT "experiments_exactly_one_owner_check" CHECK (num_nonnulls("experiments"."tactic_id", "experiments"."action_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "hypotheses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"evidence_id" uuid NOT NULL,
	"description" text NOT NULL,
	"status" "hypothesis_status" DEFAULT 'registrada' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "hypotheses_workspace_id_id_unique" UNIQUE("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"type" text NOT NULL,
	"configuration" jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"evidence_id" uuid NOT NULL,
	"content" jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"evolved_from_strategy_id" uuid,
	"status" "strategy_status" DEFAULT 'ativa' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	CONSTRAINT "strategies_workspace_id_id_unique" UNIQUE("workspace_id","id"),
	CONSTRAINT "strategies_evolved_from_strategy_id_unique" UNIQUE("evolved_from_strategy_id")
);
--> statement-breakpoint
CREATE TABLE "strategy_objectives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"strategy_id" uuid NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "strategy_objectives_workspace_id_id_unique" UNIQUE("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "strategy_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"strategy_id" uuid NOT NULL,
	"step_type" "strategy_step_type" NOT NULL,
	"content" jsonb,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "strategy_steps_strategy_id_step_type_unique" UNIQUE("strategy_id","step_type")
);
--> statement-breakpoint
CREATE TABLE "tactics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tactics_workspace_id_id_unique" UNIQUE("workspace_id","id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_tactic_id_fkey" FOREIGN KEY ("workspace_id","tactic_id") REFERENCES "public"."tactics"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_strategy_id_fkey" FOREIGN KEY ("workspace_id","strategy_id") REFERENCES "public"."strategies"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_action_id_fkey" FOREIGN KEY ("workspace_id","action_id") REFERENCES "public"."actions"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_hypothesis_id_fkey" FOREIGN KEY ("workspace_id","hypothesis_id") REFERENCES "public"."hypotheses"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_objective_id_fkey" FOREIGN KEY ("workspace_id","objective_id") REFERENCES "public"."strategy_objectives"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_tactic_id_fkey" FOREIGN KEY ("workspace_id","tactic_id") REFERENCES "public"."tactics"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_action_id_fkey" FOREIGN KEY ("workspace_id","action_id") REFERENCES "public"."actions"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hypotheses" ADD CONSTRAINT "hypotheses_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hypotheses" ADD CONSTRAINT "hypotheses_evidence_id_fkey" FOREIGN KEY ("workspace_id","evidence_id") REFERENCES "public"."evidences"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learnings" ADD CONSTRAINT "learnings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learnings" ADD CONSTRAINT "learnings_evidence_id_fkey" FOREIGN KEY ("workspace_id","evidence_id") REFERENCES "public"."evidences"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategies" ADD CONSTRAINT "strategies_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategies" ADD CONSTRAINT "strategies_evolved_from_strategy_id_fkey" FOREIGN KEY ("workspace_id","evolved_from_strategy_id") REFERENCES "public"."strategies"("workspace_id","id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_objectives" ADD CONSTRAINT "strategy_objectives_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_objectives" ADD CONSTRAINT "strategy_objectives_strategy_id_fkey" FOREIGN KEY ("workspace_id","strategy_id") REFERENCES "public"."strategies"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_steps" ADD CONSTRAINT "strategy_steps_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_steps" ADD CONSTRAINT "strategy_steps_strategy_id_fkey" FOREIGN KEY ("workspace_id","strategy_id") REFERENCES "public"."strategies"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tactics" ADD CONSTRAINT "tactics_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tactics" ADD CONSTRAINT "tactics_campaign_id_fkey" FOREIGN KEY ("workspace_id","campaign_id") REFERENCES "public"."campaigns"("workspace_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "actions_tactic_id_idx" ON "actions" USING btree ("tactic_id");--> statement-breakpoint
CREATE INDEX "actions_workspace_id_idx" ON "actions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "actions_status_idx" ON "actions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "actions_tactic_pending_idx" ON "actions" USING btree ("tactic_id") WHERE "actions"."status" in ('proposta', 'aprovada', 'em_execucao');--> statement-breakpoint
CREATE INDEX "campaigns_strategy_id_idx" ON "campaigns" USING btree ("strategy_id");--> statement-breakpoint
CREATE INDEX "campaigns_workspace_id_idx" ON "campaigns" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "evidences_action_id_idx" ON "evidences" USING btree ("action_id") WHERE "evidences"."action_id" is not null;--> statement-breakpoint
CREATE INDEX "evidences_experiment_id_idx" ON "evidences" USING btree ("experiment_id") WHERE "evidences"."experiment_id" is not null;--> statement-breakpoint
CREATE INDEX "evidences_workspace_id_idx" ON "evidences" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "experiments_hypothesis_id_idx" ON "experiments" USING btree ("hypothesis_id");--> statement-breakpoint
CREATE INDEX "experiments_objective_id_idx" ON "experiments" USING btree ("objective_id");--> statement-breakpoint
CREATE INDEX "experiments_tactic_id_idx" ON "experiments" USING btree ("tactic_id") WHERE "experiments"."tactic_id" is not null;--> statement-breakpoint
CREATE INDEX "experiments_action_id_idx" ON "experiments" USING btree ("action_id") WHERE "experiments"."action_id" is not null;--> statement-breakpoint
CREATE INDEX "experiments_workspace_id_idx" ON "experiments" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "experiments_status_idx" ON "experiments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "experiments_workspace_pending_idx" ON "experiments" USING btree ("workspace_id") WHERE "experiments"."status" = 'proposto';--> statement-breakpoint
CREATE INDEX "hypotheses_evidence_id_idx" ON "hypotheses" USING btree ("evidence_id");--> statement-breakpoint
CREATE INDEX "hypotheses_workspace_id_idx" ON "hypotheses" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "hypotheses_status_idx" ON "hypotheses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "hypotheses_workspace_prioritized_idx" ON "hypotheses" USING btree ("workspace_id") WHERE "hypotheses"."status" = 'priorizada';--> statement-breakpoint
CREATE INDEX "integrations_workspace_id_idx" ON "integrations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "learnings_evidence_id_idx" ON "learnings" USING btree ("evidence_id");--> statement-breakpoint
CREATE INDEX "learnings_workspace_id_idx" ON "learnings" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "learnings_created_at_idx" ON "learnings" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "strategies_workspace_active_unique_idx" ON "strategies" USING btree ("workspace_id") WHERE "strategies"."status" = 'ativa';--> statement-breakpoint
CREATE INDEX "strategy_objectives_strategy_id_idx" ON "strategy_objectives" USING btree ("strategy_id");--> statement-breakpoint
CREATE INDEX "strategy_steps_workspace_id_idx" ON "strategy_steps" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "tactics_campaign_id_idx" ON "tactics" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "tactics_workspace_id_idx" ON "tactics" USING btree ("workspace_id");