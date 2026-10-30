import { afterAll, describe, expect, test } from "bun:test";
import { inArray, like } from "drizzle-orm";
import { authSessions, db, users } from "@heisenberg/db";
import app from "./index";

const origin = "http://localhost:5173";
const testEmailPrefix = `auth-test-${Date.now()}-`;

function jsonRequest(path: string, body: unknown, requestOrigin = origin) {
  return app.request(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: requestOrigin,
    },
    body: JSON.stringify(body),
  });
}

function cookieFrom(response: Response): string {
  const value = response.headers.get("set-cookie");
  if (!value) {
    throw new Error("Expected authentication cookie.");
  }
  return value.split(";", 1)[0];
}

async function responseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function createUser() {
  const email = `${testEmailPrefix}${crypto.randomUUID()}@example.com`;
  const response = await jsonRequest("/auth/register", {
    email,
    password: "correct horse battery staple",
  });
  expect(response.status).toBe(201);
  return {
    email,
    cookie: cookieFrom(response),
    user: (await responseJson<{ data: { id: string; email: string } }>(response)).data,
  };
}

describe("Authentication", () => {
  test("rejects missing and unapproved Origin on registration", async () => {
    const missingOrigin = await app.request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "missing@example.com", password: "correct horse battery staple" }),
    });
    expect(missingOrigin.status).toBe(403);

    const unapprovedOrigin = await jsonRequest(
      "/auth/register",
      { email: "origin@example.com", password: "correct horse battery staple" },
      "https://unapproved.example",
    );
    expect(unapprovedOrigin.status).toBe(403);
  });

  test("registers a normalized account and creates a session", async () => {
    const email = `${testEmailPrefix}${crypto.randomUUID()}@example.com`;
    const response = await jsonRequest("/auth/register", {
      email: `  ${email.toUpperCase()}  `,
      password: "correct horse battery staple",
    });

    expect(response.status).toBe(201);
    expect((await responseJson<{ data: { email: string } }>(response)).data.email).toBe(email);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=Lax");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=604800");
  });

  test("marks authentication cookies Secure in production", async () => {
    const previousEnvironment = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const response = await jsonRequest("/auth/register", {
        email: `${testEmailPrefix}${crypto.randomUUID()}@example.com`,
        password: "correct horse battery staple",
      });
      const cookie = response.headers.get("set-cookie") ?? "";
      expect(response.status).toBe(201);
      expect(cookie).toContain("Secure");
      expect(cookie).not.toContain("Domain=");
    } finally {
      process.env.NODE_ENV = previousEnvironment;
    }
  });

  test("rejects invalid registration input", async () => {
    const response = await jsonRequest("/auth/register", {
      email: "not-an-email",
      password: "too-short",
    });
    expect(response.status).toBe(400);
  });

  test("rejects duplicate normalized email with HTTP 409", async () => {
    const email = `${testEmailPrefix}${crypto.randomUUID()}@example.com`;
    const first = await jsonRequest("/auth/register", {
      email,
      password: "correct horse battery staple",
    });
    expect(first.status).toBe(201);

    const duplicate = await jsonRequest("/auth/register", {
      email: ` ${email.toUpperCase()} `,
      password: "correct horse battery staple",
    });
    expect(duplicate.status).toBe(409);
    expect((await responseJson<{ error: { code: string } }>(duplicate)).error.code).toBe("EMAIL_ALREADY_REGISTERED");
  });

  test("logs in, returns the current user, and invalidates logout session", async () => {
    const account = await createUser();
    const login = await jsonRequest("/auth/login", {
      email: account.email,
      password: "correct horse battery staple",
    });
    expect(login.status).toBe(200);

    const cookie = cookieFrom(login);
    const me = await app.request("/auth/me", {
      headers: { Cookie: cookie },
    });
    expect(me.status).toBe(200);
    const currentUser = await responseJson<{ data: { id: string; email: string; createdAt: string } }>(me);
    expect(currentUser.data.email).toBe(account.email);
    expect(Object.keys(currentUser.data).sort()).toEqual(["createdAt", "email", "id"]);

    const wrongPassword = await jsonRequest("/auth/login", {
      email: account.email,
      password: "wrong password for this account",
    });
    expect(wrongPassword.status).toBe(401);
    expect((await responseJson<{ error: { code: string } }>(wrongPassword)).error.code).toBe("INVALID_CREDENTIALS");

    const logout = await app.request("/auth/logout", {
      method: "POST",
      headers: { Cookie: cookie, Origin: origin },
    });
    expect(logout.status).toBe(204);

    const afterLogout = await app.request("/auth/me", {
      headers: { Cookie: cookie },
    });
    expect(afterLogout.status).toBe(401);
  });

  test("rejects an expired session", async () => {
    const account = await createUser();
    const token = crypto.randomUUID();
    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(token);

    await db.insert(authSessions).values({
      userId: account.user.id,
      tokenHash: hasher.digest("hex"),
      expiresAt: new Date(Date.now() - 1000),
      revokedAt: null,
    });

    const response = await app.request("/auth/me", {
      headers: { Cookie: `heisenberg_session=${token}` },
    });
    expect(response.status).toBe(401);
  });

  test("rejects unauthenticated current-user access", async () => {
    const response = await app.request("/auth/me");
    expect(response.status).toBe(401);
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
