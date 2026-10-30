import {
  pgTable,
  integer,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";

export const equipment = pgTable("equipment", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

  name: varchar("name", { length: 255 }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});