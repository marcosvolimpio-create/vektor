-- auth.users é uma tabela gerenciada pelo Supabase Auth e não deve ser
-- criada pelas migrations do domínio.
CREATE TYPE "public"."member_role" AS ENUM('admin', 'membro');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('convidado', 'ativo', 'removido');--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid,
	"email" text NOT NULL,
	"status" "member_status" DEFAULT 'convidado' NOT NULL,
	"role" "member_role" NOT NULL,
	"invited_by" uuid,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"joined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_workspace_id_id_unique" UNIQUE("workspace_id","id"),
	CONSTRAINT "members_workspace_id_email_unique" UNIQUE("workspace_id","email"),
	CONSTRAINT "members_workspace_id_user_id_unique" UNIQUE("workspace_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_invited_by_fkey" FOREIGN KEY ("workspace_id","invited_by") REFERENCES "public"."members"("workspace_id","id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "members_user_id_idx" ON "members" USING btree ("user_id") WHERE "members"."user_id" is not null;