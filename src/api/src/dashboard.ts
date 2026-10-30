import { sql } from "drizzle-orm";
import { db, equipment, recipes } from "@heisenberg/db";
import { eq } from "drizzle-orm";

export async function getDashboardSummary(userId: string) {
  const [equipmentResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(equipment);
  const [recipeResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(recipes)
    .where(eq(recipes.userId, userId));

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
      available: false,
      count: null,
    },
    completedSessions: {
      available: false,
      count: null,
    },
    recentActivity: {
      available: false,
      items: [],
    },
  };
}
