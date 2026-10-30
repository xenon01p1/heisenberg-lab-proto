import {
  recipeListResponseSchema,
  recipeResponseSchema,
  type Recipe,
  type RecipeStepInput,
} from "@heisenberg/contracts";

export function recipesFromPayload(payload: unknown): Recipe[] | null {
  const parsed = recipeListResponseSchema.safeParse(payload);
  return parsed.success ? parsed.data.data : null;
}

export function recipeFromPayload(payload: unknown): Recipe | null {
  const parsed = recipeResponseSchema.safeParse(payload);
  return parsed.success ? parsed.data.data : null;
}

export function emptyRecipeStep(): RecipeStepInput {
  return { label: "", description: "" };
}
