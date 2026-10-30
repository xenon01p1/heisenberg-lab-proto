import { afterAll, describe, expect, test } from "bun:test";
import { inArray, like } from "drizzle-orm";
import { authSessions, db, equipment, users } from "@heisenberg/db";
import app from "./index";

const origin = "http://localhost:5173";
const testEmailPrefix = `equipment-test-${Date.now()}-`;

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

function request(path: string, cookie: string, method: string, body?: unknown) {
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

describe("Equipment Management", () => {
  test("requires authentication and Origin for mutations", async () => {
    expect((await app.request("/equipment")).status).toBe(401);
    const account = await createUser();
    const response = await app.request("/equipment", {
      method: "POST",
      headers: { Cookie: account.cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Mixer", type: "Bench", condition: "Ready", available: true }),
    });
    expect(response.status).toBe(403);
  });

  test("creates, lists, reads, updates, and deletes owned equipment", async () => {
    const account = await createUser();
    const create = await request("/equipment", account.cookie, "POST", {
      name: "  Fictional Mixer  ", type: "Bench unit", condition: "Ready", available: true,
    });
    expect(create.status).toBe(201);
    const created = (await responseJson<{ data: { id: number; name: string; available: boolean } }>(create)).data;
    expect(created.name).toBe("Fictional Mixer");
    expect(created.available).toBe(true);

    const list = await request("/equipment", account.cookie, "GET");
    expect(list.status).toBe(200);
    expect((await responseJson<{ data: unknown[] }>(list)).data).toHaveLength(1);

    const detail = await request(`/equipment/${created.id}`, account.cookie, "GET");
    expect(detail.status).toBe(200);

    const update = await request(`/equipment/${created.id}`, account.cookie, "PATCH", {
      name: "Updated Mixer", type: "Bench unit", condition: "Needs review", available: false,
    });
    expect(update.status).toBe(200);
    expect((await responseJson<{ data: { condition: string; available: boolean } }>(update)).data).toMatchObject({ condition: "Needs review", available: false });

    const remove = await request(`/equipment/${created.id}`, account.cookie, "DELETE");
    expect(remove.status).toBe(204);
    expect((await request(`/equipment/${created.id}`, account.cookie, "GET")).status).toBe(404);
  });

  test("rejects invalid input and hides another user's equipment", async () => {
    const owner = await createUser();
    const other = await createUser();
    const invalid = await request("/equipment", owner.cookie, "POST", {
      name: "", type: "Bench", condition: "Ready", available: true,
    });
    expect(invalid.status).toBe(400);

    const create = await request("/equipment", owner.cookie, "POST", {
      name: "Private item", type: "Cabinet", condition: "Ready", available: true,
    });
    const equipmentId = (await responseJson<{ data: { id: number } }>(create)).data.id;
    expect((await request(`/equipment/${equipmentId}`, other.cookie, "GET")).status).toBe(404);
    expect((await request(`/equipment/${equipmentId}`, other.cookie, "PATCH", {
      name: "No access", type: "Cabinet", condition: "Ready", available: false,
    })).status).toBe(404);
    expect((await request("/equipment/not-an-id", owner.cookie, "GET")).status).toBe(400);
  });
});

afterAll(async () => {
  const testUsers = await db.select({ id: users.id }).from(users).where(like(users.email, `${testEmailPrefix}%`));
  const ids = testUsers.map((user) => user.id);
  if (ids.length) {
    await db.delete(equipment).where(inArray(equipment.userId, ids));
    await db.delete(authSessions).where(inArray(authSessions.userId, ids));
    await db.delete(users).where(inArray(users.id, ids));
  }
});
