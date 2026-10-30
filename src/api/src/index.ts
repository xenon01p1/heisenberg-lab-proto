import { Hono } from "hono";
import { checkDatabaseConnection } from "@heisenberg/db";
import { authCredentialsSchema, recipeInputSchema } from "@heisenberg/contracts";
import { getDashboardSummary } from "./dashboard";
import {
  createRecipe,
  deleteRecipe,
  getRecipe,
  listRecipes,
  RecipeNotFoundError,
  updateRecipe,
} from "./recipes";
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
