import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined");
}

export async function checkDatabaseConnection() {
  await db.execute(sql`SELECT 1`);
  return true;
}

const client = postgres(databaseUrl);

export const db = drizzle({ client });