CREATE TABLE "session_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"recipe_step_id" uuid NOT NULL,
	"step_order" integer NOT NULL,
	"status" varchar(20) NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "session_steps_status_check" CHECK ("session_steps"."status" in ('PENDING', 'COMPLETED')),
	CONSTRAINT "session_steps_order_check" CHECK ("session_steps"."step_order" > 0)
);
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_status_check";--> statement-breakpoint
ALTER TABLE "session_events" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "session_steps" ADD CONSTRAINT "session_steps_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_steps" ADD CONSTRAINT "session_steps_recipe_step_id_recipe_steps_id_fk" FOREIGN KEY ("recipe_step_id") REFERENCES "public"."recipe_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_steps_session_id_idx" ON "session_steps" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_steps_session_recipe_step_unique" ON "session_steps" USING btree ("session_id","recipe_step_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_steps_session_order_unique" ON "session_steps" USING btree ("session_id","step_order");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_status_check" CHECK ("sessions"."status" in ('DRAFT', 'READY', 'RUNNING', 'PAUSED', 'ABORTED', 'COMPLETED', 'FAILED'));