import { afterAll, describe, expect, test } from "bun:test";
import { eq, inArray, like, sql } from "drizzle-orm";
import { authSessions, db, equipment, recipeSteps, recipes, sessionEvents, sessions, users } from "@heisenberg/db";
import app from "./index";
import { setSimulationRandomSource } from "./sessions";

const origin = "http://localhost:5173";
const testEmailPrefix = `dashboard-test-${Date.now()}-`;

function cookieFrom(response: Response): string {
  const value = response.headers.get("set-cookie");
  if (!value) {
    throw new Error("Expected authentication cookie.");
  }
  return value.split(";", 1)[0];
}

async function registerUser(email: string) {
  const registration = await app.request("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
    },
    body: JSON.stringify({ email, password: "correct horse battery staple" }),
  });
  expect(registration.status).toBe(201);
  const cookie = cookieFrom(registration);
  const body = (await registration.json()) as { data: { id: string; email: string } };
  return { cookie, user: body.data };
}

describe("Dashboard", () => {
  test("rejects unauthenticated summary access", async () => {
    const response = await app.request("/dashboard/summary");
    expect(response.status).toBe(401);
  });

  test("returns empty metrics and empty activity for a new user", async () => {
    const account = await registerUser(`${testEmailPrefix}${crypto.randomUUID()}@example.com`);

    const response = await app.request("/dashboard/summary", {
      headers: { Cookie: account.cookie },
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

    expect(payload.data.equipment).toEqual({ available: true, count: 0 });
    expect(payload.data.recipes).toEqual({ available: true, count: 0 });
    expect(payload.data.sessions).toEqual({ available: true, count: 0 });
    expect(payload.data.completedSessions).toEqual({ available: true, count: 0 });
    expect(payload.data.recentActivity).toEqual({ available: true, items: [] });
  });

  test("returns real session, completion, and recent activity metrics with user isolation", async () => {
    const accountA = await registerUser(`${testEmailPrefix}${crypto.randomUUID()}@example.com`);
    const accountB = await registerUser(`${testEmailPrefix}${crypto.randomUUID()}@example.com`);

    // Account A creates a single-step recipe
    const recipeResponse = await app.request("/recipes", {
      method: "POST",
      headers: { Cookie: accountA.cookie, "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ title: "Super Blue", steps: [{ label: "Simulate crystallization" }] }),
    });
    expect(recipeResponse.status).toBe(201);
    const recipe = (await recipeResponse.json()) as { data: { id: string } };

    // Get seeded operator
    const operatorsResponse = await app.request("/operators", { headers: { Cookie: accountA.cookie } });
    const operator = (await operatorsResponse.json()) as { data: Array<{ id: string }> };
    const operatorId = operator.data[0]?.id;
    if (!operatorId) throw new Error("Expected seeded operator");

    // Account A creates session
    const sessionResponse = await app.request("/sessions", {
      method: "POST",
      headers: { Cookie: accountA.cookie, "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ recipeId: recipe.data.id, operatorId }),
    });
    expect(sessionResponse.status).toBe(201);
    const session = (await sessionResponse.json()) as { data: { id: string; revision: number } };

    // Prepare and start session
    const prepareResponse = await app.request(`/sessions/${session.data.id}/prepare`, {
      method: "POST",
      headers: { Cookie: accountA.cookie, "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ expectedRevision: session.data.revision }),
    });
    expect(prepareResponse.status).toBe(200);

    const startResponse = await app.request(`/sessions/${session.data.id}/start`, {
      method: "POST",
      headers: { Cookie: accountA.cookie, "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ expectedRevision: 1 }),
    });
    expect(startResponse.status).toBe(200);

    // Deterministically advance final step to succeed, completing the session
    const restoreRandom = setSimulationRandomSource(() => 0);
    const advanceResponse = await app.request(`/sessions/${session.data.id}/advance`, {
      method: "POST",
      headers: { Cookie: accountA.cookie, "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ expectedRevision: 2, action: "CAUTIOUS" }),
    });
    restoreRandom();
    expect(advanceResponse.status).toBe(200);

    // Verify Account A dashboard
    const responseA = await app.request("/dashboard/summary", {
      headers: { Cookie: accountA.cookie },
    });
    expect(responseA.status).toBe(200);

    const payloadA = (await responseA.json()) as {
      data: {
        equipment: { available: boolean; count: number | null };
        recipes: { available: boolean; count: number | null };
        sessions: { available: boolean; count: number | null };
        completedSessions: { available: boolean; count: number | null };
        recentActivity: { available: boolean; items: Array<{ id: string; label: string; occurredAt: string }> };
      };
    };

    expect(payloadA.data.equipment).toEqual({ available: true, count: 0 });
    expect(payloadA.data.recipes).toEqual({ available: true, count: 1 });
    expect(payloadA.data.sessions).toEqual({ available: true, count: 1 });
    expect(payloadA.data.completedSessions).toEqual({ available: true, count: 1 });
    expect(payloadA.data.recentActivity.available).toBe(true);
    expect(payloadA.data.recentActivity.items.length).toBe(4); // SESSION_CREATED, PREPARE, START, TURN_SUCCEEDED

    // First item is newest
    expect(payloadA.data.recentActivity.items[0]?.label).toContain("Super Blue");
    expect(payloadA.data.recentActivity.items[0]?.label).toContain("TURN_SUCCEEDED");
    expect(payloadA.data.recentActivity.items[0]?.label).toContain("COMPLETED");

    // Verify Account B isolation (Account B has zero data and no activity)
    const responseB = await app.request("/dashboard/summary", {
      headers: { Cookie: accountB.cookie },
    });
    expect(responseB.status).toBe(200);
    const payloadB = (await responseB.json()) as {
      data: {
        recipes: { count: number | null };
        sessions: { count: number | null };
        completedSessions: { count: number | null };
        recentActivity: { items: unknown[] };
      };
    };
    expect(payloadB.data.recipes.count).toBe(0);
    expect(payloadB.data.sessions.count).toBe(0);
    expect(payloadB.data.completedSessions.count).toBe(0);
    expect(payloadB.data.recentActivity.items).toEqual([]);
  });
});

afterAll(async () => {
  const testUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(like(users.email, "dashboard-test-%"));

  if (testUsers.length > 0) {
    const ids = testUsers.map((user) => user.id);
    const ownedSessions = await db.select({ id: sessions.id }).from(sessions).where(inArray(sessions.userId, ids));
    if (ownedSessions.length) {
      await db.delete(sessionEvents).where(inArray(sessionEvents.sessionId, ownedSessions.map((session) => session.id)));
      await db.delete(sessions).where(inArray(sessions.id, ownedSessions.map((session) => session.id)));
    }
    await db.delete(sessionEvents).where(inArray(sessionEvents.actorId, ids));
    const ownedRecipes = await db.select({ id: recipes.id }).from(recipes).where(inArray(recipes.userId, ids));
    if (ownedRecipes.length) await db.delete(recipeSteps).where(inArray(recipeSteps.recipeId, ownedRecipes.map((recipe) => recipe.id)));
    if (ownedRecipes.length) await db.delete(recipes).where(inArray(recipes.id, ownedRecipes.map((recipe) => recipe.id)));
    await db.delete(equipment).where(inArray(equipment.userId, ids));
    await db.delete(authSessions).where(inArray(authSessions.userId, ids));
    await db.delete(users).where(inArray(users.id, ids));
  }
});
