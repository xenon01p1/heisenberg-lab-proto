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

export const dashboardActivityItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  occurredAt: z.iso.datetime(),
});

export const dashboardActivitySchema = z.object({
  available: z.boolean(),
  items: z.array(dashboardActivityItemSchema),
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
export type DashboardActivityItem = z.infer<typeof dashboardActivityItemSchema>;
export type DashboardActivity = z.infer<typeof dashboardActivitySchema>;
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

export const equipmentInputSchema = z.object({
  name: z.string().trim().min(1).max(255),
  type: z.string().trim().min(1).max(100),
  condition: z.string().trim().min(1).max(100),
  available: z.boolean(),
});

export const equipmentSchema = equipmentInputSchema.extend({
  id: z.number().int().positive(),
  createdAt: z.iso.datetime(),
});

export const equipmentListResponseSchema = z.object({
  data: z.array(equipmentSchema),
});

export const equipmentResponseSchema = z.object({
  data: equipmentSchema,
});

export type EquipmentInput = z.infer<typeof equipmentInputSchema>;
export type Equipment = z.infer<typeof equipmentSchema>;

export const operatorSchema = z.object({
  id: z.uuid(),
  displayName: z.string(),
});

export const sessionStatusSchema = z.enum(["DRAFT", "READY", "RUNNING", "PAUSED", "ABORTED", "COMPLETED", "FAILED"]);

export const sessionCreateSchema = z.object({
  recipeId: z.uuid(),
  operatorId: z.uuid(),
  equipmentId: z.number().int().positive().nullable().optional(),
});

export const sessionActionSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
});

export const sessionEventSchema = z.object({
  id: z.uuid(),
  action: z.string(),
  fromStatus: sessionStatusSchema.nullable(),
  toStatus: sessionStatusSchema,
  revision: z.number().int().nonnegative(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  createdAt: z.iso.datetime(),
});

export const simulationActionSchema = z.enum(["CAUTIOUS", "BALANCED", "BOLD"]);

export const sessionAdvanceSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
  action: simulationActionSchema,
});

export const sessionStepStatusSchema = z.enum(["PENDING", "COMPLETED"]);

export const sessionStepSchema = z.object({
  id: z.uuid(),
  recipeStepId: z.uuid(),
  stepOrder: z.number().int().positive(),
  label: z.string(),
  description: z.string().nullable(),
  status: sessionStepStatusSchema,
  completedAt: z.iso.datetime().nullable(),
});

export const sessionProgressSchema = z.object({
  id: z.uuid(),
  status: sessionStatusSchema,
  revision: z.number().int().nonnegative(),
  completedSteps: z.number().int().nonnegative(),
  totalSteps: z.number().int().positive(),
  steps: z.array(sessionStepSchema),
  nextStep: sessionStepSchema.nullable(),
  availableActions: z.array(simulationActionSchema),
});

export const turnOutcomeSchema = z.object({
  action: simulationActionSchema,
  stepOrder: z.number().int().positive(),
  success: z.boolean(),
  equipmentModifier: z.number().int(),
  effectiveProbability: z.number().int().min(5).max(95),
});

export const sessionProgressResponseSchema = z.object({
  data: sessionProgressSchema,
});

export const sessionAdvanceResponseSchema = z.object({
  data: sessionProgressSchema.extend({ outcome: turnOutcomeSchema }),
});

export const sessionSchema = z.object({
  id: z.uuid(),
  recipeId: z.uuid(),
  recipeTitle: z.string(),
  operator: operatorSchema,
  equipmentId: z.number().int().positive().nullable(),
  equipmentName: z.string().nullable(),
  status: sessionStatusSchema,
  revision: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  events: z.array(sessionEventSchema).optional(),
});

export const operatorListResponseSchema = z.object({ data: z.array(operatorSchema) });
export const sessionListResponseSchema = z.object({ data: z.array(sessionSchema) });
export const sessionResponseSchema = z.object({ data: sessionSchema });
export const sessionEventsResponseSchema = z.object({ data: z.array(sessionEventSchema) });

export type Operator = z.infer<typeof operatorSchema>;
export type SessionStatus = z.infer<typeof sessionStatusSchema>;
export type SessionCreate = z.infer<typeof sessionCreateSchema>;
export type SessionAction = z.infer<typeof sessionActionSchema>;
export type SessionEvent = z.infer<typeof sessionEventSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type SimulationAction = z.infer<typeof simulationActionSchema>;
export type SessionAdvance = z.infer<typeof sessionAdvanceSchema>;
export type SessionStep = z.infer<typeof sessionStepSchema>;
export type SessionProgress = z.infer<typeof sessionProgressSchema>;
export type TurnOutcome = z.infer<typeof turnOutcomeSchema>;
