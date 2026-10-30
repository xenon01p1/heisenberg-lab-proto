import { and, desc, eq, sql } from "drizzle-orm";
import { db, equipment, recipes, sessionEvents, sessions } from "@heisenberg/db";

export async function getDashboardSummary(userId: string) {
  const [equipmentResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(equipment)
    .where(eq(equipment.userId, userId));
  const [recipeResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(recipes)
    .where(eq(recipes.userId, userId));
  const [sessionResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sessions)
    .where(eq(sessions.userId, userId));
  const [completedSessionResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.status, "COMPLETED")));
  const activityRows = await db
    .select({
      id: sessionEvents.id,
      action: sessionEvents.action,
      toStatus: sessionEvents.toStatus,
      createdAt: sessionEvents.createdAt,
      recipeTitle: recipes.title,
    })
    .from(sessionEvents)
    .innerJoin(sessions, eq(sessionEvents.sessionId, sessions.id))
    .leftJoin(recipes, eq(sessions.recipeId, recipes.id))
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessionEvents.createdAt))
    .limit(8);

  return {
    equipment: {
      available: true,
      count: equipmentResult?.count ?? 0,
    },
    recipes: {
      available: true,
      count: recipeResult?.count ?? 0,
    },
    sessions: {
      available: true,
      count: sessionResult?.count ?? 0,
    },
    completedSessions: {
      available: true,
      count: completedSessionResult?.count ?? 0,
    },
    recentActivity: {
      available: true,
      items: activityRows.map((activity) => ({
        id: activity.id,
        label: activity.recipeTitle
          ? `${activity.recipeTitle} — ${activity.action} · ${activity.toStatus}`
          : `${activity.action} · ${activity.toStatus}`,
        occurredAt: activity.createdAt.toISOString(),
      })),
    },
  };
}
