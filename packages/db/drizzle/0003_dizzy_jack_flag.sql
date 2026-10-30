ALTER TABLE "equipment" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "equipment" ADD COLUMN "type" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "equipment" ADD COLUMN "condition" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "equipment" ADD COLUMN "available" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "equipment_user_id_idx" ON "equipment" USING btree ("user_id");