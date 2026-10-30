CREATE TABLE "recipe_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"label" varchar(200) NOT NULL,
	"description" text,
	"step_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recipe_steps_recipe_id_idx" ON "recipe_steps" USING btree ("recipe_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_steps_recipe_order_unique" ON "recipe_steps" USING btree ("recipe_id","step_order");--> statement-breakpoint
CREATE INDEX "recipes_user_id_idx" ON "recipes" USING btree ("user_id");