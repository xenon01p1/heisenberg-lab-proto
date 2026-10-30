import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const authCredentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(12).max(128),
});

export const publicUserSchema = z.object({
  id: z.uuid(),
  email: z.string().email(),
  createdAt: z.iso.datetime(),
});

export const authResponseSchema = z.object({
  data: publicUserSchema,
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export const dashboardMetricSchema = z.object({
  available: z.boolean(),
  count: z.number().int().nonnegative().nullable(),
});

export const dashboardActivitySchema = z.object({
  available: z.boolean(),
  items: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      occurredAt: z.iso.datetime(),
    }),
  ),
});

export const dashboardSummarySchema = z.object({
  data: z.object({
    equipment: dashboardMetricSchema,
    recipes: dashboardMetricSchema,
    sessions: dashboardMetricSchema,
    completedSessions: dashboardMetricSchema,
    recentActivity: dashboardActivitySchema,
  }),
});

export type AuthCredentials = z.infer<typeof authCredentialsSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type DashboardMetric = z.infer<typeof dashboardMetricSchema>;
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

export const recipeStepInputSchema = z.object({
  label: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
});

export const recipeInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  steps: z.array(recipeStepInputSchema).min(1).max(100),
});

export const recipeStepSchema = recipeStepInputSchema.extend({
  id: z.uuid(),
  stepOrder: z.number().int().min(1),
});

export const recipeSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  steps: z.array(recipeStepSchema).min(1),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const recipeListResponseSchema = z.object({
  data: z.array(recipeSchema),
});

export const recipeResponseSchema = z.object({
  data: recipeSchema,
});

export type RecipeStepInput = z.infer<typeof recipeStepInputSchema>;
export type RecipeInput = z.infer<typeof recipeInputSchema>;
export type RecipeStep = z.infer<typeof recipeStepSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
