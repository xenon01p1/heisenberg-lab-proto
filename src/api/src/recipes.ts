import { and, asc, eq } from "drizzle-orm";
import {
  db,
  recipeSteps,
  recipes,
} from "@heisenberg/db";
import type { Recipe, RecipeInput } from "@heisenberg/contracts";

export class RecipeNotFoundError extends Error {}

function toRecipe(
  recipe: typeof recipes.$inferSelect,
  steps: Array<typeof recipeSteps.$inferSelect>,
): Recipe {
  return {
    id: recipe.id,
    title: recipe.title,
    steps: steps.map((step) => ({
      id: step.id,
      label: step.label,
      description: step.description,
      stepOrder: step.stepOrder,
    })),
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
  };
}

async function getSteps(recipeId: string) {
  return db
    .select()
    .from(recipeSteps)
    .where(eq(recipeSteps.recipeId, recipeId))
    .orderBy(asc(recipeSteps.stepOrder));
}

export async function listRecipes(userId: string): Promise<Recipe[]> {
  const records = await db
    .select()
    .from(recipes)
    .where(eq(recipes.userId, userId))
    .orderBy(asc(recipes.title));

  return Promise.all(records.map(async (recipe) => toRecipe(recipe, await getSteps(recipe.id))));
}

export async function getRecipe(userId: string, recipeId: string): Promise<Recipe> {
  const [recipe] = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)))
    .limit(1);

  if (!recipe) {
    throw new RecipeNotFoundError();
  }

  return toRecipe(recipe, await getSteps(recipe.id));
}

export async function createRecipe(userId: string, input: RecipeInput): Promise<Recipe> {
  return db.transaction(async (tx) => {
    const [recipe] = await tx
      .insert(recipes)
      .values({ userId, title: input.title })
      .returning();

    if (!recipe) {
      throw new Error("Recipe was not created.");
    }

    const steps = await tx
      .insert(recipeSteps)
      .values(
        input.steps.map((step, index) => ({
          recipeId: recipe.id,
          label: step.label,
          description: step.description ?? null,
          stepOrder: index + 1,
        })),
      )
      .returning();

    return toRecipe(recipe, steps.sort((left, right) => left.stepOrder - right.stepOrder));
  });
}

export async function updateRecipe(
  userId: string,
  recipeId: string,
  input: RecipeInput,
): Promise<Recipe> {
  return db.transaction(async (tx) => {
    const [recipe] = await tx
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)))
      .limit(1);

    if (!recipe) {
      throw new RecipeNotFoundError();
    }

    const [updatedRecipe] = await tx
      .update(recipes)
      .set({ title: input.title, updatedAt: new Date() })
      .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)))
      .returning();

    if (!updatedRecipe) {
      throw new Error("Recipe was not updated.");
    }

    await tx.delete(recipeSteps).where(eq(recipeSteps.recipeId, recipeId));
    const steps = await tx
      .insert(recipeSteps)
      .values(
        input.steps.map((step, index) => ({
          recipeId,
          label: step.label,
          description: step.description ?? null,
          stepOrder: index + 1,
        })),
      )
      .returning();

    return toRecipe(updatedRecipe, steps.sort((left, right) => left.stepOrder - right.stepOrder));
  });
}

export async function deleteRecipe(userId: string, recipeId: string): Promise<void> {
  const deleted = await db
    .delete(recipes)
    .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)))
    .returning({ id: recipes.id });

  if (!deleted.length) {
    throw new RecipeNotFoundError();
  }
}
