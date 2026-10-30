import { afterAll, describe, expect, test } from "bun:test";
import { eq, inArray, like, sql } from "drizzle-orm";
import { authSessions, db, equipment, users } from "@heisenberg/db";
import app from "./index";

const origin = "http://localhost:5173";
const testEmailPrefix = `dashboard-test-${Date.now()}-`;

function cookieFrom(response: Response): string {
  const value = response.headers.get("set-cookie");
  if (!value) {
    throw new Error("Expected authentication cookie.");
  }
  return value.split(";", 1)[0];
}

describe("Dashboard", () => {
  test("rejects unauthenticated summary access", async () => {
    const response = await app.request("/dashboard/summary");
    expect(response.status).toBe(401);
  });

  test("returns the real equipment count and explicit unavailable metrics", async () => {
    const email = `${testEmailPrefix}${crypto.randomUUID()}@example.com`;
    const registration = await app.request("/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
      },
      body: JSON.stringify({ email, password: "correct horse battery staple" }),
    });
    expect(registration.status).toBe(201);

    const response = await app.request("/dashboard/summary", {
      headers: { Cookie: cookieFrom(registration) },
    });
    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      data: {
        equipment: { available: boolean; count: number | null };
        recipes: { available: boolean; count: number | null };
        sessions: { available: boolean; count: number | null };
        completedSessions: { available: boolean; count: number | null };
        recentActivity: { available: boolean; items: unknown[] };
      };
    };
    const registeredUser = (await registration.clone().json()) as { data: { id: string } };
    const [equipmentCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(equipment)
      .where(eq(equipment.userId, registeredUser.data.id));

    expect(payload.data.equipment).toEqual({
      available: true,
      count: equipmentCount?.count ?? 0,
    });
    expect(payload.data.recipes).toEqual({ available: true, count: 0 });
    expect(payload.data.sessions).toEqual({ available: false, count: null });
    expect(payload.data.completedSessions).toEqual({ available: false, count: null });
    expect(payload.data.recentActivity).toEqual({ available: false, items: [] });
  });
});

afterAll(async () => {
  const testUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(like(users.email, `${testEmailPrefix}%`));

  if (testUsers.length > 0) {
    await db.delete(authSessions).where(inArray(authSessions.userId, testUsers.map((user) => user.id)));
    await db.delete(users).where(inArray(users.id, testUsers.map((user) => user.id)));
  }
});
