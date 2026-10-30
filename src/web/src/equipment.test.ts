import { describe, expect, test } from "bun:test";
import { equipmentFromPayload, equipmentItemFromPayload } from "./equipment";

const item = {
  id: 1,
  name: "Fictional mixer",
  type: "Bench unit",
  condition: "Ready",
  available: true,
  createdAt: "2026-10-30T00:00:00.000Z",
};

describe("equipment presentation contracts", () => {
  test("accepts valid equipment responses", () => {
    expect(equipmentItemFromPayload({ data: item })?.available).toBe(true);
    expect(equipmentFromPayload({ data: [item] })).toHaveLength(1);
  });

  test("rejects invalid equipment responses", () => {
    expect(equipmentItemFromPayload({ data: { ...item, available: "yes" } })).toBeNull();
  });
});
