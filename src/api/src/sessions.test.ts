import { afterAll, describe, expect, test } from "bun:test";
import { inArray, like } from "drizzle-orm";
import { authSessions, db, equipment, recipeSteps, recipes, sessionEvents, sessions, users } from "@heisenberg/db";
import { setSimulationRandomSource } from "./sessions";
import app from "./index";

const origin = "http://localhost:5173";
const testEmailPrefix = `session-test-${Date.now()}-`;

function cookieFrom(response: Response): string {
  const value = response.headers.get("set-cookie");
  if (!value) throw new Error("Expected authentication cookie.");
  return value.split(";", 1)[0];
}

async function responseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function createUser() {
  const email = `${testEmailPrefix}${crypto.randomUUID()}@example.com`;
  const response = await app.request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({ email, password: "correct horse battery staple" }),
  });
  expect(response.status).toBe(201);
  return { cookie: cookieFrom(response), user: (await responseJson<{ data: { id: string } }>(response)).data };
}

function request(path: string, cookie: string, method = "GET", body?: unknown) {
  return app.request(path, {
    method,
    headers: { Cookie: cookie, Origin: origin, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Session Management", () => {
  test("creates a draft, records lifecycle events, and enforces revisions", async () => {
    const account = await createUser();
    const recipeResponse = await request("/recipes", account.cookie, "POST", {
      title: "Session recipe", steps: [{ label: "Abstract stage" }],
    });
    const recipeId = (await responseJson<{ data: { id: string } }>(recipeResponse)).data.id;
    const equipmentResponse = await request("/equipment", account.cookie, "POST", {
      name: "Session equipment", type: "Bench", condition: "Ready", available: true,
    });
    const equipmentId = (await responseJson<{ data: { id: number } }>(equipmentResponse)).data.id;
    const operatorsResponse = await request("/operators", account.cookie);
    expect(operatorsResponse.status).toBe(200);
    const operatorId = (await responseJson<{ data: Array<{ id: string }> }>(operatorsResponse)).data[0]?.id;
    if (!operatorId) throw new Error("Expected seeded operator.");

    const createdResponse = await request("/sessions", account.cookie, "POST", { recipeId, operatorId, equipmentId });
    expect(createdResponse.status).toBe(201);
    let session = (await responseJson<{ data: { id: string; status: string; revision: number; events?: unknown[] } }>(createdResponse)).data;
    expect(session.status).toBe("DRAFT");
    expect(session.revision).toBe(0);
    expect(session.events).toHaveLength(1);

    for (const [action, from, to] of [["prepare", "DRAFT", "READY"], ["start", "READY", "RUNNING"], ["pause", "RUNNING", "PAUSED"], ["resume", "PAUSED", "RUNNING"], ["abort", "RUNNING", "ABORTED"]] as const) {
      const response = await request(`/sessions/${session.id}/${action}`, account.cookie, "POST", { expectedRevision: session.revision });
      expect(response.status).toBe(200);
      const updated = (await responseJson<{ data: { status: string; revision: number } }>(response)).data;
      expect(updated.status).toBe(to);
      expect(updated.revision).toBe(session.revision + 1);
      expect(from).toBeDefined();
      session = { ...session, ...updated };
    }

    const stale = await request(`/sessions/${session.id}/abort`, account.cookie, "POST", { expectedRevision: 4 });
    expect(stale.status).toBe(409);
    const invalid = await request(`/sessions/${session.id}/start`, account.cookie, "POST", { expectedRevision: session.revision });
    expect(invalid.status).toBe(409);
    const detail = await request(`/sessions/${session.id}`, account.cookie);
    expect((await responseJson<{ data: { status: string; revision: number; events: unknown[] } }>(detail)).data).toMatchObject({ status: "ABORTED", revision: 5 });
    expect((await responseJson<{ data: unknown[] }>(await request(`/sessions/${session.id}/events`, account.cookie))).data).toHaveLength(6);

    const recipeUpdate = await request(`/recipes/${recipeId}`, account.cookie, "PATCH", { title: "Blocked", steps: [{ label: "Changed" }] });
    expect(recipeUpdate.status).toBe(422);
  });

  test("enforces ownership and validates setup references", async () => {
    const owner = await createUser();
    const other = await createUser();
    const operatorsResponse = await request("/operators", owner.cookie);
    const operatorId = (await responseJson<{ data: Array<{ id: string }> }>(operatorsResponse)).data[0]?.id;
    if (!operatorId) throw new Error("Expected seeded operator.");
    const invalid = await request("/sessions", owner.cookie, "POST", { recipeId: crypto.randomUUID(), operatorId });
    expect(invalid.status).toBe(422);
    expect((await request("/sessions", other.cookie)).status).toBe(200);
    expect((await request("/sessions/not-a-uuid", owner.cookie)).status).toBe(400);
  });

  test("advances one step, preserves a failed step, and makes terminal sessions immutable", async () => {
    const account = await createUser();
    const recipeResponse = await request("/recipes", account.cookie, "POST", {
      title: "Engine recipe", steps: [{ label: "First stage" }, { label: "Second stage" }],
    });
    const recipeId = (await responseJson<{ data: { id: string } }>(recipeResponse)).data.id;
    const operatorId = (await responseJson<{ data: Array<{ id: string }> }>(await request("/operators", account.cookie))).data[0]?.id;
    if (!operatorId) throw new Error("Expected seeded operator.");
    const session = (await responseJson<{ data: { id: string; revision: number } }>(await request("/sessions", account.cookie, "POST", { recipeId, operatorId }))).data;
    await request(`/sessions/${session.id}/prepare`, account.cookie, "POST", { expectedRevision: session.revision });
    await request(`/sessions/${session.id}/start`, account.cookie, "POST", { expectedRevision: 1 });

    const restoreRandom = setSimulationRandomSource(() => 0);
    const success = await request(`/sessions/${session.id}/advance`, account.cookie, "POST", { expectedRevision: 2, action: "BALANCED" });
    restoreRandom();
    expect(success.status).toBe(200);
    const successBody = (await responseJson<{ data: { status: string; revision: number; completedSteps: number; outcome: { success: boolean } } }>(success)).data;
    expect(successBody).toMatchObject({ status: "RUNNING", revision: 3, completedSteps: 1, outcome: { success: true } });

    const restoreFailure = setSimulationRandomSource(() => 0.99);
    const failure = await request(`/sessions/${session.id}/advance`, account.cookie, "POST", { expectedRevision: 3, action: "BOLD" });
    restoreFailure();
    expect(failure.status).toBe(200);
    const failureBody = (await responseJson<{ data: { status: string; revision: number; completedSteps: number; nextStep: { stepOrder: number } | null; outcome: { success: boolean } } }>(failure)).data;
    expect(failureBody).toMatchObject({ status: "FAILED", revision: 4, completedSteps: 1, nextStep: { stepOrder: 2 }, outcome: { success: false } });
    expect((await request(`/sessions/${session.id}/advance`, account.cookie, "POST", { expectedRevision: 4, action: "CAUTIOUS" })).status).toBe(409);
  });
});

afterAll(async () => {
  const testUsers = await db.select({ id: users.id }).from(users).where(like(users.email, `${testEmailPrefix}%`));
  const ids = testUsers.map((user) => user.id);
  if (!ids.length) return;
  const ownedSessions = await db.select({ id: sessions.id }).from(sessions).where(inArray(sessions.userId, ids));
  if (ownedSessions.length) {
    await db.delete(sessionEvents).where(inArray(sessionEvents.sessionId, ownedSessions.map((session) => session.id)));
    await db.delete(sessions).where(inArray(sessions.id, ownedSessions.map((session) => session.id)));
  }
  const ownedRecipes = await db.select({ id: recipes.id }).from(recipes).where(inArray(recipes.userId, ids));
  if (ownedRecipes.length) await db.delete(recipeSteps).where(inArray(recipeSteps.recipeId, ownedRecipes.map((recipe) => recipe.id)));
  if (ownedRecipes.length) await db.delete(recipes).where(inArray(recipes.id, ownedRecipes.map((recipe) => recipe.id)));
  await db.delete(equipment).where(inArray(equipment.userId, ids));
  await db.delete(authSessions).where(inArray(authSessions.userId, ids));
  await db.delete(users).where(inArray(users.id, ids));
});
