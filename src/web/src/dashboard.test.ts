import { describe, expect, test } from "bun:test";
import {
  dashboardHasAvailableActivity,
  dashboardMetricDescription,
  dashboardMetricValue,
  formatActivityTime,
} from "./dashboard";

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
    expect(dashboardMetricValue(summary.sessions)).toBe("Unavailable");
    expect(dashboardMetricValue(summary.completedSessions)).toBe("Unavailable");
    expect(dashboardMetricDescription(summary.sessions, "Your sessions", "Session data unavailable")).toBe(
      "Session data unavailable",
    );
    expect(dashboardHasAvailableActivity(summary)).toBe(false);
  });

  test("presents real user-owned metrics when available", () => {
    const summary = {
      equipment: { available: true, count: 3 },
      recipes: { available: true, count: 1 },
      sessions: { available: true, count: 4 },
      completedSessions: { available: true, count: 0 },
      recentActivity: {
        available: true,
        items: [
          {
            id: "event-1",
            label: "Blue Sky — START · RUNNING",
            occurredAt: "2026-10-30T10:00:00.000Z",
          },
        ],
      },
    };

    expect(dashboardMetricValue(summary.sessions)).toBe("4");
    expect(dashboardMetricValue(summary.completedSessions)).toBe("0");
    expect(dashboardMetricDescription(summary.sessions, "Your sessions", "Session data unavailable")).toBe(
      "Your sessions",
    );
    expect(
      dashboardMetricDescription(summary.completedSessions, "Your completed sessions", "Session history unavailable"),
    ).toBe("Your completed sessions");
    expect(dashboardHasAvailableActivity(summary)).toBe(true);
  });

  test("handles empty activity when available", () => {
    const summary = {
      equipment: { available: true, count: 0 },
      recipes: { available: true, count: 0 },
      sessions: { available: true, count: 0 },
      completedSessions: { available: true, count: 0 },
      recentActivity: { available: true, items: [] },
    };

    expect(dashboardHasAvailableActivity(summary)).toBe(false);
  });

  test("formats activity timestamps safely", () => {
    const formatted = formatActivityTime("2026-10-30T10:00:00.000Z");
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);

    // Invalid ISO string should fallback to returning the raw string
    expect(formatActivityTime("invalid-date")).toBe("invalid-date");
  });
});
