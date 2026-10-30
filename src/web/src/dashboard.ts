import type { DashboardMetric, DashboardSummary } from "@heisenberg/contracts";

export function dashboardMetricValue(metric: DashboardMetric): string {
  return metric.available && metric.count !== null ? String(metric.count) : "Unavailable";
}

export function dashboardMetricDescription(metric: DashboardMetric, availableDescription: string, unavailableDescription: string): string {
  return metric.available ? availableDescription : unavailableDescription;
}

export function dashboardHasAvailableActivity(summary: DashboardSummary["data"]): boolean {
  return summary.recentActivity.available && summary.recentActivity.items.length > 0;
}
