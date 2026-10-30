import { describe, expect, test } from "bun:test";
import { emptyRecipeStep, recipeFromPayload, recipesFromPayload } from "./recipes";

const recipe = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Fictional workflow",
  steps: [{ id: "22222222-2222-4222-8222-222222222222", label: "Stage", description: null, stepOrder: 1 }],
  createdAt: "2026-10-30T00:00:00.000Z",
  updatedAt: "2026-10-30T00:00:00.000Z",
};

describe("recipe presentation contracts", () => {
  test("accepts valid ordered recipe responses", () => {
    expect(recipeFromPayload({ data: recipe })?.steps[0]?.stepOrder).toBe(1);
    expect(recipesFromPayload({ data: [recipe] })).toHaveLength(1);
  });

  test("rejects malformed recipe responses and creates blank steps", () => {
    expect(recipeFromPayload({ data: { ...recipe, steps: [] } })).toBeNull();
    expect(emptyRecipeStep()).toEqual({ label: "", description: "" });
  });
});
