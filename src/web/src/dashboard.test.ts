import { describe, expect, test } from "bun:test";
import { dashboardHasAvailableActivity, dashboardMetricValue } from "./dashboard";

describe("dashboard presentation", () => {
  test("does not turn unavailable metrics into fake zeroes or activity", () => {
    const unavailable = { available: false, count: null } as const;
    const summary = {
      equipment: { available: true, count: 0 },
      recipes: { available: true, count: 2 },
      sessions: unavailable,
      completedSessions: unavailable,
      recentActivity: { available: false, items: [] },
    };

    expect(dashboardMetricValue(summary.equipment)).toBe("0");
    expect(dashboardMetricValue(summary.recipes)).toBe("2");
    expect(dashboardHasAvailableActivity(summary)).toBe(false);
  });
});
