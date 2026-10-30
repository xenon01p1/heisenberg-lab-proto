import {
  pgTable,
  integer,
  text,
  uuid,
  varchar,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("auth_sessions_token_hash_unique").on(table.tokenHash),
    index("auth_sessions_user_id_idx").on(table.userId),
    index("auth_sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const equipment = pgTable("equipment", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

  name: varchar("name", { length: 255 }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recipes = pgTable(
  "recipes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("recipes_user_id_idx").on(table.userId)],
);

export const recipeSteps = pgTable(
  "recipe_steps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 200 }).notNull(),
    description: text("description"),
    stepOrder: integer("step_order").notNull(),
  },
  (table) => [
    index("recipe_steps_recipe_id_idx").on(table.recipeId),
    uniqueIndex("recipe_steps_recipe_order_unique").on(table.recipeId, table.stepOrder),
  ],
);
