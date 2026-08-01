CREATE TYPE "public"."recommendation_priority" AS ENUM('baixa', 'media', 'alta');--> statement-breakpoint
CREATE TYPE "public"."recommendation_status" AS ENUM('pendente', 'aceita', 'executada', 'descartada');--> statement-breakpoint
CREATE TYPE "public"."recommendation_type" AS ENUM('acao_atrasada', 'campanha_sem_progresso', 'muitas_acoes_abertas', 'objetivo_sem_iniciativas', 'evidencia_negativa', 'kpi_abaixo_meta');--> statement-breakpoint
CREATE TABLE "execution_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"strategy_id" uuid NOT NULL,
	"type" "recommendation_type" NOT NULL,
	"priority" "recommendation_priority" NOT NULL,
	"justification" text NOT NULL,
	"context" jsonb NOT NULL,
	"suggested_action" text NOT NULL,
	"status" "recommendation_status" DEFAULT 'pendente' NOT NULL,
	"dedupe_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "execution_recommendations_workspace_id_id_unique" UNIQUE("workspace_id","id")
);
--> statement-breakpoint
ALTER TABLE "execution_recommendations" ADD CONSTRAINT "execution_recommendations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_recommendations" ADD CONSTRAINT "execution_recommendations_strategy_id_fkey" FOREIGN KEY ("workspace_id","strategy_id") REFERENCES "public"."strategies"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "execution_recommendations_workspace_id_idx" ON "execution_recommendations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "execution_recommendations_strategy_id_idx" ON "execution_recommendations" USING btree ("strategy_id");--> statement-breakpoint
CREATE INDEX "execution_recommendations_status_idx" ON "execution_recommendations" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "execution_recommendations_pending_dedupe_unique" ON "execution_recommendations" USING btree ("workspace_id","dedupe_key") WHERE "execution_recommendations"."status" = 'pendente';