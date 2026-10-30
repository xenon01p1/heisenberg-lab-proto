import { describe, expect, test } from "bun:test";
import { getProfileFields } from "./profile";

describe("profile presentation", () => {
  test("exposes only the approved read-only account fields", () => {
    const fields = getProfileFields({
      id: "00000000-0000-4000-8000-000000000001",
      email: "operator@example.com",
      createdAt: "2026-10-30T00:00:00.000Z",
    });

    expect(fields.map((field) => field.id)).toEqual(["email", "createdAt"]);
    expect(fields[0]?.value).toBe("operator@example.com");
    expect(fields[1]?.value).not.toBe("");
  });
});
