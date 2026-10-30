import { Hono } from "hono";
import { checkDatabaseConnection } from "@heisenberg/db";
import {
  authCredentialsSchema,
  equipmentInputSchema,
  recipeInputSchema,
  sessionAdvanceSchema,
  sessionActionSchema,
  sessionCreateSchema,
} from "@heisenberg/contracts";
import { getDashboardSummary } from "./dashboard";
import {
  createRecipe,
  deleteRecipe,
  getRecipe,
  listRecipes,
  RecipeInUseError,
  RecipeNotFoundError,
  updateRecipe,
} from "./recipes";
import {
  createEquipment,
  deleteEquipment,
  EquipmentNotFoundError,
  getEquipment,
  listEquipment,
  updateEquipment,
} from "./equipment";
import {
  createSession,
  getSession,
  getSessionEvents,
  listOperators,
  listSessions,
  SessionInvalidTransitionError,
  SessionNotFoundError,
  SessionReferenceError,
  SessionRevisionConflictError,
  advanceSession,
  transitionSession,
  getSessionProgress,
} from "./sessions";
import {
  DuplicateEmailError,
  clearAuthenticationCookie,
  loginUser,
  requireAuthentication,
  registerUser,
  revokeSession,
  setAuthenticationCookie,
  validateOrigin,
} from "./auth";
import type { AuthEnv } from "./auth";

const app = new Hono<AuthEnv>();

function validationError(message = "Request validation failed.") {
  return {
    error: {
      code: "VALIDATION_ERROR",
      message,
    },
  };
}

function equipmentIdFromParam(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

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

app.get("/dashboard/summary", requireAuthentication, async (c) => {
  try {
    return c.json({ data: await getDashboardSummary(c.get("user").id) });
  } catch (error) {
    console.error("Dashboard summary failed:", error);
    return c.json(
      { error: { code: "INTERNAL_ERROR", message: "Unable to load dashboard summary." } },
      500,
    );
  }
});

app.get("/recipes", requireAuthentication, async (c) => {
  try {
    return c.json({ data: await listRecipes(c.get("user").id) });
  } catch (error) {
    console.error("Recipe list failed:", error);
    return c.json(
      { error: { code: "INTERNAL_ERROR", message: "Unable to load recipes." } },
      500,
    );
  }
});

app.get("/equipment", requireAuthentication, async (c) => {
  try {
    return c.json({ data: await listEquipment(c.get("user").id) });
  } catch (error) {
    console.error("Equipment list failed:", error);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Unable to load equipment." } }, 500);
  }
});

app.post("/equipment", validateOrigin, requireAuthentication, async (c) => {
  let input: unknown;
  try {
    input = await c.req.json();
  } catch {
    return c.json(validationError(), 400);
  }
  const parsed = equipmentInputSchema.safeParse(input);
  if (!parsed.success) return c.json(validationError("Equipment name, type, condition, and availability are required."), 400);
  try {
    return c.json({ data: await createEquipment(c.get("user").id, parsed.data) }, 201);
  } catch (error) {
    console.error("Equipment creation failed:", error);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Unable to create equipment." } }, 500);
  }
});

app.get("/equipment/:id", requireAuthentication, async (c) => {
  const equipmentId = equipmentIdFromParam(c.req.param("id"));
  if (equipmentId === null) return c.json(validationError("Equipment ID must be a positive integer."), 400);
  try {
    return c.json({ data: await getEquipment(c.get("user").id, equipmentId) });
  } catch (error) {
    if (error instanceof EquipmentNotFoundError) return c.json({ error: { code: "NOT_FOUND", message: "Equipment not found." } }, 404);
    console.error("Equipment detail failed:", error);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Unable to load equipment." } }, 500);
  }
});

app.patch("/equipment/:id", validateOrigin, requireAuthentication, async (c) => {
  const equipmentId = equipmentIdFromParam(c.req.param("id"));
  if (equipmentId === null) return c.json(validationError("Equipment ID must be a positive integer."), 400);
  let input: unknown;
  try {
    input = await c.req.json();
  } catch {
    return c.json(validationError(), 400);
  }
  const parsed = equipmentInputSchema.safeParse(input);
  if (!parsed.success) return c.json(validationError("Equipment name, type, condition, and availability are required."), 400);
  try {
    return c.json({ data: await updateEquipment(c.get("user").id, equipmentId, parsed.data) });
  } catch (error) {
    if (error instanceof EquipmentNotFoundError) return c.json({ error: { code: "NOT_FOUND", message: "Equipment not found." } }, 404);
    console.error("Equipment update failed:", error);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Unable to update equipment." } }, 500);
  }
});

app.delete("/equipment/:id", validateOrigin, requireAuthentication, async (c) => {
  const equipmentId = equipmentIdFromParam(c.req.param("id"));
  if (equipmentId === null) return c.json(validationError("Equipment ID must be a positive integer."), 400);
  try {
    await deleteEquipment(c.get("user").id, equipmentId);
    return c.body(null, 204);
  } catch (error) {
    if (error instanceof EquipmentNotFoundError) return c.json({ error: { code: "NOT_FOUND", message: "Equipment not found." } }, 404);
    console.error("Equipment deletion failed:", error);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Unable to delete equipment." } }, 500);
  }
});

app.get("/operators", requireAuthentication, async (c) => {
  try {
    return c.json({ data: await listOperators() });
  } catch (error) {
    console.error("Operator list failed:", error);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Unable to load operators." } }, 500);
  }
});

app.get("/sessions", requireAuthentication, async (c) => {
  try {
    return c.json({ data: await listSessions(c.get("user").id) });
  } catch (error) {
    console.error("Session list failed:", error);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Unable to load sessions." } }, 500);
  }
});

app.post("/sessions", validateOrigin, requireAuthentication, async (c) => {
  let input: unknown;
  try {
    input = await c.req.json();
  } catch {
    return c.json(validationError(), 400);
  }
  const parsed = sessionCreateSchema.safeParse(input);
  if (!parsed.success) return c.json(validationError("A valid recipe, operator, and optional equipment are required."), 400);
  try {
    return c.json({ data: await createSession(c.get("user").id, parsed.data) }, 201);
  } catch (error) {
    if (error instanceof SessionReferenceError) return c.json({ error: { code: "BUSINESS_RULE_VIOLATION", message: "The selected recipe, operator, or equipment is not valid." } }, 422);
    console.error("Session creation failed:", error);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Unable to create session." } }, 500);
  }
});

app.get("/sessions/:id", requireAuthentication, async (c) => {
  const sessionId = c.req.param("id");
  if (!isUuid(sessionId)) return c.json(validationError("Session ID must be a UUID."), 400);
  try {
    return c.json({ data: await getSession(c.get("user").id, sessionId) });
  } catch (error) {
    if (error instanceof SessionNotFoundError) return c.json({ error: { code: "NOT_FOUND", message: "Session not found." } }, 404);
    console.error("Session detail failed:", error);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Unable to load session." } }, 500);
  }
});

app.get("/sessions/:id/events", requireAuthentication, async (c) => {
  const sessionId = c.req.param("id");
  if (!isUuid(sessionId)) return c.json(validationError("Session ID must be a UUID."), 400);
  try {
    return c.json({ data: await getSessionEvents(c.get("user").id, sessionId) });
  } catch (error) {
    if (error instanceof SessionNotFoundError) return c.json({ error: { code: "NOT_FOUND", message: "Session not found." } }, 404);
    console.error("Session events failed:", error);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Unable to load session events." } }, 500);
  }
});

app.get("/sessions/:id/progress", requireAuthentication, async (c) => {
  const sessionId = c.req.param("id");
  if (!isUuid(sessionId)) return c.json(validationError("Session ID must be a UUID."), 400);
  try {
    return c.json({ data: await getSessionProgress(c.get("user").id, sessionId) });
  } catch (error) {
    if (error instanceof SessionNotFoundError) return c.json({ error: { code: "NOT_FOUND", message: "Session not found." } }, 404);
    console.error("Session progress failed:", error);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Unable to load session progress." } }, 500);
  }
});

app.post("/sessions/:id/advance", validateOrigin, requireAuthentication, async (c) => {
  const sessionId = c.req.param("id");
  if (!isUuid(sessionId)) return c.json(validationError("Session ID must be a UUID."), 400);
  let input: unknown;
  try {
    input = await c.req.json();
  } catch {
    return c.json(validationError("expectedRevision and action are required."), 400);
  }
  const parsed = sessionAdvanceSchema.safeParse(input);
  if (!parsed.success) return c.json(validationError("expectedRevision and a valid action are required."), 400);
  try {
    const result = await advanceSession(c.get("user").id, sessionId, parsed.data);
    return c.json({ data: { ...result.progress, outcome: result.outcome } });
  } catch (error) {
    if (error instanceof SessionNotFoundError) return c.json({ error: { code: "NOT_FOUND", message: "Session not found." } }, 404);
    if (error instanceof SessionRevisionConflictError) return c.json({ error: { code: "REVISION_CONFLICT", message: "The session changed; reload before trying again." } }, 409);
    if (error instanceof SessionInvalidTransitionError) return c.json({ error: { code: "INVALID_STATE_TRANSITION", message: "That session cannot advance from its current status." } }, 409);
    console.error("Session advance failed:", error);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Unable to advance session." } }, 500);
  }
});

for (const action of ["prepare", "start", "pause", "resume", "abort"] as const) {
  app.post(`/sessions/:id/${action}`, validateOrigin, requireAuthentication, async (c) => {
    const sessionId = c.req.param("id");
    if (!isUuid(sessionId)) return c.json(validationError("Session ID must be a UUID."), 400);
    let input: unknown;
    try {
      input = await c.req.json();
    } catch {
      return c.json(validationError("expectedRevision is required."), 400);
    }
    const parsed = sessionActionSchema.safeParse(input);
    if (!parsed.success) return c.json(validationError("expectedRevision is required."), 400);
    try {
      return c.json({ data: await transitionSession(c.get("user").id, sessionId, action, parsed.data) });
    } catch (error) {
      if (error instanceof SessionNotFoundError) return c.json({ error: { code: "NOT_FOUND", message: "Session not found." } }, 404);
      if (error instanceof SessionRevisionConflictError) return c.json({ error: { code: "REVISION_CONFLICT", message: "The session changed; reload before trying again." } }, 409);
      if (error instanceof SessionInvalidTransitionError) return c.json({ error: { code: "INVALID_STATE_TRANSITION", message: "That action is not allowed from the current status." } }, 409);
      console.error(`Session ${action} failed:`, error);
      return c.json({ error: { code: "INTERNAL_ERROR", message: "Unable to update session." } }, 500);
    }
  });
}

app.post("/recipes", validateOrigin, requireAuthentication, async (c) => {
  let input: unknown;
  try {
    input = await c.req.json();
  } catch {
    return c.json(validationError(), 400);
  }

  const parsed = recipeInputSchema.safeParse(input);
  if (!parsed.success) {
    return c.json(validationError("Recipe title and at least one valid step are required."), 400);
  }

  try {
    return c.json({ data: await createRecipe(c.get("user").id, parsed.data) }, 201);
  } catch (error) {
    console.error("Recipe creation failed:", error);
    return c.json(
      { error: { code: "INTERNAL_ERROR", message: "Unable to create recipe." } },
      500,
    );
  }
});

app.get("/recipes/:id", requireAuthentication, async (c) => {
  const recipeId = c.req.param("id");
  try {
    return c.json({ data: await getRecipe(c.get("user").id, recipeId) });
  } catch (error) {
    if (error instanceof RecipeNotFoundError) {
      return c.json({ error: { code: "NOT_FOUND", message: "Recipe not found." } }, 404);
    }
    console.error("Recipe detail failed:", error);
    return c.json(
      { error: { code: "INTERNAL_ERROR", message: "Unable to load recipe." } },
      500,
    );
  }
});

app.patch("/recipes/:id", validateOrigin, requireAuthentication, async (c) => {
  let input: unknown;
  try {
    input = await c.req.json();
  } catch {
    return c.json(validationError(), 400);
  }

  const parsed = recipeInputSchema.safeParse(input);
  if (!parsed.success) {
    return c.json(validationError("Recipe title and at least one valid step are required."), 400);
  }

  try {
    return c.json({ data: await updateRecipe(c.get("user").id, c.req.param("id"), parsed.data) });
  } catch (error) {
    if (error instanceof RecipeNotFoundError) {
      return c.json({ error: { code: "NOT_FOUND", message: "Recipe not found." } }, 404);
    }
    if (error instanceof RecipeInUseError) {
      return c.json({ error: { code: "BUSINESS_RULE_VIOLATION", message: "Referenced recipes cannot be changed." } }, 422);
    }
    console.error("Recipe update failed:", error);
    return c.json(
      { error: { code: "INTERNAL_ERROR", message: "Unable to update recipe." } },
      500,
    );
  }
});

app.delete("/recipes/:id", validateOrigin, requireAuthentication, async (c) => {
  try {
    await deleteRecipe(c.get("user").id, c.req.param("id"));
    return c.body(null, 204);
  } catch (error) {
    if (error instanceof RecipeNotFoundError) {
      return c.json({ error: { code: "NOT_FOUND", message: "Recipe not found." } }, 404);
    }
    if (error instanceof RecipeInUseError) {
      return c.json({ error: { code: "BUSINESS_RULE_VIOLATION", message: "Referenced recipes cannot be deleted." } }, 422);
    }
    console.error("Recipe deletion failed:", error);
    return c.json(
      { error: { code: "INTERNAL_ERROR", message: "Unable to delete recipe." } },
      500,
    );
  }
});

app.post("/auth/register", validateOrigin, async (c) => {
  let input: unknown;
  try {
    input = await c.req.json();
  } catch {
    return c.json(validationError(), 400);
  }

  const parsed = authCredentialsSchema.safeParse(input);
  if (!parsed.success) {
    return c.json(validationError(), 400);
  }

  try {
    const result = await registerUser(parsed.data.email, parsed.data.password);
    setAuthenticationCookie(c, result.token);
    return c.json({ data: result.user }, 201);
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      return c.json(
        {
          error: {
            code: "EMAIL_ALREADY_REGISTERED",
            message: "An account with this email already exists.",
          },
        },
        409,
      );
    }

    console.error("Registration failed:", error);
    return c.json(
      { error: { code: "INTERNAL_ERROR", message: "Unable to register account." } },
      500,
    );
  }
});

app.post("/auth/login", validateOrigin, async (c) => {
  let input: unknown;
  try {
    input = await c.req.json();
  } catch {
    return c.json(validationError(), 400);
  }

  const parsed = authCredentialsSchema.safeParse(input);
  if (!parsed.success) {
    return c.json(validationError(), 400);
  }

  try {
    const result = await loginUser(parsed.data.email, parsed.data.password);
    if (!result) {
      return c.json(
        { error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } },
        401,
      );
    }

    setAuthenticationCookie(c, result.token);
    return c.json({ data: result.user });
  } catch (error) {
    console.error("Login failed:", error);
    return c.json(
      { error: { code: "INTERNAL_ERROR", message: "Unable to log in." } },
      500,
    );
  }
});

app.post("/auth/logout", validateOrigin, requireAuthentication, async (c) => {
  try {
    await revokeSession(c.get("sessionId"));
    clearAuthenticationCookie(c);
    return c.body(null, 204);
  } catch (error) {
    console.error("Logout failed:", error);
    return c.json(
      { error: { code: "INTERNAL_ERROR", message: "Unable to log out." } },
      500,
    );
  }
});

app.get("/auth/me", requireAuthentication, (c) => {
  return c.json({ data: c.get("user") });
});

export default app;
