import { and, eq, gt, isNull } from "drizzle-orm";
import { getCookie, deleteCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import {
  authSessions,
  db,
  users,
} from "@heisenberg/db";
import type { PublicUser } from "@heisenberg/contracts";

export const AUTH_COOKIE_NAME = "heisenberg_session";
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;

export type AuthEnv = {
  Variables: {
    user: PublicUser;
    sessionId: string;
  };
};

class DuplicateEmailError extends Error {}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

function hashSessionToken(token: string): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(token);
  return hasher.digest("hex");
}

function toPublicUser(user: typeof users.$inferSelect): PublicUser {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

function cookieOptions(): Parameters<typeof setCookie>[3] {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test-secure",
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export function setAuthenticationCookie(c: Context, token: string): void {
  setCookie(c, AUTH_COOKIE_NAME, token, cookieOptions());
}

export function clearAuthenticationCookie(c: Context): void {
  deleteCookie(c, AUTH_COOKIE_NAME, {
    ...cookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
}

function configuredOrigins(): Set<string> {
  const configured = process.env.AUTH_ALLOWED_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set(configured?.length ? configured : ["http://localhost:5173"]);
}

export const validateOrigin = createMiddleware<AuthEnv>(async (c, next) => {
  const origin = c.req.header("Origin");
  if (!origin || !configuredOrigins().has(origin)) {
    return c.json(
      { error: { code: "ORIGIN_NOT_ALLOWED", message: "Origin is not allowed." } },
      403,
    );
  }

  await next();
});

export const requireAuthentication = createMiddleware<AuthEnv>(async (c, next) => {
  const token = getCookie(c, AUTH_COOKIE_NAME);
  if (!token) {
    return c.json(
      { error: { code: "UNAUTHENTICATED", message: "Authentication is required." } },
      401,
    );
  }

  const tokenHash = hashSessionToken(token);
  const [record] = await db
    .select({
      sessionId: authSessions.id,
      user: users,
    })
    .from(authSessions)
    .innerJoin(users, eq(authSessions.userId, users.id))
    .where(
      and(
        eq(authSessions.tokenHash, tokenHash),
        isNull(authSessions.revokedAt),
        gt(authSessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!record) {
    return c.json(
      { error: { code: "UNAUTHENTICATED", message: "Authentication is required." } },
      401,
    );
  }

  c.set("user", toPublicUser(record.user));
  c.set("sessionId", record.sessionId);
  await next();
});

export async function registerUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const token = createSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_SECONDS * 1000);

  try {
    return await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: normalizedEmail,
          passwordHash: await Bun.password.hash(password, {
            algorithm: "argon2id",
            memoryCost: 65536,
            timeCost: 2,
          }),
        })
        .onConflictDoNothing({ target: users.email })
        .returning();

      if (!user) {
        throw new DuplicateEmailError();
      }

      await tx.insert(authSessions).values({
        userId: user.id,
        tokenHash: hashSessionToken(token),
        expiresAt,
        createdAt: now,
      });

      return { user: toPublicUser(user), token };
    });
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      throw error;
    }
    throw error;
  }
}

export async function loginUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user || !(await Bun.password.verify(password, user.passwordHash))) {
    return null;
  }

  const token = createSessionToken();
  const now = new Date();
  await db.insert(authSessions).values({
    userId: user.id,
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(now.getTime() + SESSION_DURATION_SECONDS * 1000),
    createdAt: now,
  });

  return { user: toPublicUser(user), token };
}

export async function revokeSession(sessionId: string): Promise<void> {
  await db
    .update(authSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(authSessions.id, sessionId), isNull(authSessions.revokedAt)));
}

export { DuplicateEmailError };
