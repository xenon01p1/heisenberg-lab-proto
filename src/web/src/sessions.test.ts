import { describe, expect, test } from "bun:test";
import { operatorsFromPayload, sessionAdvanceFromPayload, sessionFromPayload, sessionProgressFromPayload, sessionsFromPayload } from "./sessions";

const operator = { id: "11111111-1111-4111-8111-111111111111", displayName: "Operator North" };
const session = {
  id: "22222222-2222-4222-8222-222222222222",
  recipeId: "33333333-3333-4333-8333-333333333333",
  recipeTitle: "Workflow",
  operator,
  equipmentId: null,
  equipmentName: null,
  status: "DRAFT",
  revision: 0,
  createdAt: "2026-10-30T00:00:00.000Z",
  updatedAt: "2026-10-30T00:00:00.000Z",
};

describe("session presentation contracts", () => {
  test("accepts operator and session responses", () => {
    expect(operatorsFromPayload({ data: [operator] })).toHaveLength(1);
    expect(sessionFromPayload({ data: session })?.status).toBe("DRAFT");
    expect(sessionsFromPayload({ data: [session] })).toHaveLength(1);
  });

  test("accepts engine terminal statuses", () => {
    expect(sessionFromPayload({ data: { ...session, status: "COMPLETED" } })?.status).toBe("COMPLETED");
    expect(sessionFromPayload({ data: { ...session, status: "FAILED" } })?.status).toBe("FAILED");
  });

  test("accepts authoritative simulation progress and outcomes", () => {
    const progress = {
      id: session.id,
      status: "RUNNING",
      revision: 2,
      completedSteps: 1,
      totalSteps: 2,
      steps: [{ id: "44444444-4444-4444-8444-444444444444", recipeStepId: "33333333-3333-4333-8333-333333333333", stepOrder: 1, label: "Stage", description: null, status: "COMPLETED", completedAt: "2026-10-30T00:00:00.000Z" }],
      nextStep: null,
      availableActions: ["CAUTIOUS", "BALANCED", "BOLD"],
    };
    expect(sessionProgressFromPayload({ data: progress })?.completedSteps).toBe(1);
    expect(sessionAdvanceFromPayload({ data: { ...progress, outcome: { action: "BALANCED", stepOrder: 1, success: true, equipmentModifier: 5, effectiveProbability: 80 } } })?.outcome.success).toBe(true);
  });
});
