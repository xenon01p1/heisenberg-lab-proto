import { afterAll, describe, expect, test } from "bun:test";
import { inArray, like } from "drizzle-orm";
import { authSessions, db, recipeSteps, recipes, users } from "@heisenberg/db";
import app from "./index";

const origin = "http://localhost:5173";
const testEmailPrefix = `recipe-test-${Date.now()}-`;

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

function recipeRequest(path: string, cookie: string, method: string, body?: unknown) {
  return app.request(path, {
    method,
    headers: {
      Cookie: cookie,
      Origin: origin,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Recipe Management", () => {
  test("requires authentication and Origin for mutations", async () => {
    expect((await app.request("/recipes")).status).toBe(401);
    const account = await createUser();
    const response = await app.request("/recipes", {
      method: "POST",
      headers: { Cookie: account.cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Missing origin", steps: [{ label: "Stage" }] }),
    });
    expect(response.status).toBe(403);
  });

  test("creates, lists, reads, updates, and deletes an owned recipe", async () => {
    const account = await createUser();
    const create = await recipeRequest("/recipes", account.cookie, "POST", {
      title: "  First fictional workflow  ",
      steps: [
        { label: "Stage one", description: "An abstract first stage." },
        { label: "Stage two" },
      ],
    });
    expect(create.status).toBe(201);
    const created = (await responseJson<{ data: { id: string; title: string; steps: Array<{ stepOrder: number; label: string }> } }>(create)).data;
    expect(created.title).toBe("First fictional workflow");
    expect(created.steps.map((step: { stepOrder: number }) => step.stepOrder)).toEqual([1, 2]);

    const list = await recipeRequest("/recipes", account.cookie, "GET");
    expect(list.status).toBe(200);
    expect((await responseJson<{ data: unknown[] }>(list)).data).toHaveLength(1);

    const detail = await recipeRequest(`/recipes/${created.id}`, account.cookie, "GET");
    expect(detail.status).toBe(200);
    expect((await responseJson<{ data: { steps: Array<{ label: string }> } }>(detail)).data.steps[1]?.label).toBe("Stage two");

    const update = await recipeRequest(`/recipes/${created.id}`, account.cookie, "PATCH", {
      title: "Updated workflow",
      steps: [{ label: "Only stage", description: null }],
    });
    expect(update.status).toBe(200);
    expect((await responseJson<{ data: { steps: unknown[] } }>(update)).data.steps).toHaveLength(1);

    const remove = await recipeRequest(`/recipes/${created.id}`, account.cookie, "DELETE");
    expect(remove.status).toBe(204);
    expect((await recipeRequest(`/recipes/${created.id}`, account.cookie, "GET")).status).toBe(404);
  });

  test("rejects empty steps and hides another user's recipe", async () => {
    const owner = await createUser();
    const other = await createUser();
    const invalid = await recipeRequest("/recipes", owner.cookie, "POST", { title: "No steps", steps: [] });
    expect(invalid.status).toBe(400);

    const created = await recipeRequest("/recipes", owner.cookie, "POST", {
      title: "Private workflow",
      steps: [{ label: "Private stage" }],
    });
    const recipeId = (await responseJson<{ data: { id: string } }>(created)).data.id;
    expect((await recipeRequest(`/recipes/${recipeId}`, other.cookie, "GET")).status).toBe(404);
    expect((await recipeRequest(`/recipes/${recipeId}`, other.cookie, "PATCH", {
      title: "Unauthorized",
      steps: [{ label: "No access" }],
    })).status).toBe(404);
  });
});

afterAll(async () => {
  const testUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(like(users.email, `${testEmailPrefix}%`));
  const ids = testUsers.map((user) => user.id);
  if (ids.length) {
    const ownedRecipes = await db.select({ id: recipes.id }).from(recipes).where(inArray(recipes.userId, ids));
    if (ownedRecipes.length) {
      await db.delete(recipeSteps).where(inArray(recipeSteps.recipeId, ownedRecipes.map((recipe) => recipe.id)));
      await db.delete(recipes).where(inArray(recipes.id, ownedRecipes.map((recipe) => recipe.id)));
    }
    await db.delete(authSessions).where(inArray(authSessions.userId, ids));
    await db.delete(users).where(inArray(users.id, ids));
  }
});
