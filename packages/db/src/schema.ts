import {
  pgTable,
  integer,
  text,
  uuid,
  varchar,
  timestamp,
  index,
  uniqueIndex,
  boolean,
  check,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

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

export const equipment = pgTable(
  "equipment",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    type: varchar("type", { length: 100 }).notNull(),
    condition: varchar("condition", { length: 100 }).notNull(),
    available: boolean("available").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("equipment_user_id_idx").on(table.userId)],
);

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

export const operators = pgTable("operators", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    recipeId: uuid("recipe_id").notNull().references(() => recipes.id),
    operatorId: uuid("operator_id").notNull().references(() => operators.id),
    equipmentId: integer("equipment_id").references(() => equipment.id, { onDelete: "set null" }),
    status: varchar("status", { length: 20 }).notNull(),
    revision: integer("revision").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_recipe_id_idx").on(table.recipeId),
    check("sessions_status_check", sql`${table.status} in ('DRAFT', 'READY', 'RUNNING', 'PAUSED', 'ABORTED', 'COMPLETED', 'FAILED')`),
  ],
);

export const sessionSteps = pgTable(
  "session_steps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
    recipeStepId: uuid("recipe_step_id").notNull().references(() => recipeSteps.id),
    stepOrder: integer("step_order").notNull(),
    status: varchar("status", { length: 20 }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("session_steps_session_id_idx").on(table.sessionId),
    uniqueIndex("session_steps_session_recipe_step_unique").on(table.sessionId, table.recipeStepId),
    uniqueIndex("session_steps_session_order_unique").on(table.sessionId, table.stepOrder),
    check("session_steps_status_check", sql`${table.status} in ('PENDING', 'COMPLETED')`),
    check("session_steps_order_check", sql`${table.stepOrder} > 0`),
  ],
);

export const sessionEvents = pgTable(
  "session_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").notNull().references(() => users.id),
    action: varchar("action", { length: 40 }).notNull(),
    fromStatus: varchar("from_status", { length: 20 }),
    toStatus: varchar("to_status", { length: 20 }).notNull(),
    revision: integer("revision").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("session_events_session_id_idx").on(table.sessionId),
    uniqueIndex("session_events_session_revision_unique").on(table.sessionId, table.revision),
  ],
);
