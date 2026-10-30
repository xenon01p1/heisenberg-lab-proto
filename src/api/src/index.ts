import { Hono } from "hono";
import { checkDatabaseConnection } from "@heisenberg/db";

const app = new Hono();

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.get("/health/db", async (c) => {
  try {
    await checkDatabaseConnection();

    return c.json({
      database: "connected",
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    return c.json(
      {
        database: "disconnected",
      },
      503
    );
  }
});

export default app;