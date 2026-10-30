import { and, asc, desc, eq } from "drizzle-orm";
import {
  db,
  equipment,
  operators,
  recipeSteps,
  recipes,
  sessionEvents,
  sessionSteps,
  sessions,
} from "@heisenberg/db";
import type {
  Operator,
  Session,
  SessionAction,
  SessionAdvance,
  SessionEvent,
  SessionProgress,
  SessionStatus,
  SimulationAction,
  TurnOutcome,
} from "@heisenberg/contracts";

export const SESSION_STATUSES = ["DRAFT", "READY", "RUNNING", "PAUSED", "ABORTED", "COMPLETED", "FAILED"] as const;
type Status = (typeof SESSION_STATUSES)[number];

export class SessionNotFoundError extends Error {}
export class SessionRevisionConflictError extends Error {}
export class SessionInvalidTransitionError extends Error {}
export class SessionReferenceError extends Error {}

function toOperator(operator: typeof operators.$inferSelect): Operator {
  return { id: operator.id, displayName: operator.displayName };
}

function toEvent(event: typeof sessionEvents.$inferSelect): SessionEvent {
  return {
    id: event.id,
    action: event.action,
    fromStatus: event.fromStatus as SessionStatus | null,
    toStatus: event.toStatus as SessionStatus,
    revision: event.revision,
    ...(event.metadata ? { metadata: event.metadata as Record<string, unknown> } : {}),
    createdAt: event.createdAt.toISOString(),
  };
}

const ACTION_PROBABILITIES: Record<SimulationAction, number> = {
  CAUTIOUS: 85,
  BALANCED: 75,
  BOLD: 65,
};

let randomSource = (): number => crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32;

export function setSimulationRandomSource(source: () => number): () => void {
  const previous = randomSource;
  randomSource = source;
  return () => {
    randomSource = previous;
  };
}

export function calculateTurnProbability(action: SimulationAction, equipmentAvailable: boolean): { base: number; equipmentModifier: number; effective: number } {
  const base = ACTION_PROBABILITIES[action];
  const equipmentModifier = equipmentAvailable ? 5 : 0;
  return { base, equipmentModifier, effective: Math.min(95, Math.max(5, base + equipmentModifier)) };
}

type JoinedSession = {
  sessions: typeof sessions.$inferSelect;
  recipes: typeof recipes.$inferSelect;
  operators: typeof operators.$inferSelect;
  equipment: typeof equipment.$inferSelect | null;
};

function toSession(row: JoinedSession, events?: SessionEvent[]): Session {
  return {
    id: row.sessions.id,
    recipeId: row.sessions.recipeId,
    recipeTitle: row.recipes.title,
    operator: toOperator(row.operators),
    equipmentId: row.equipment?.id ?? null,
    equipmentName: row.equipment?.name ?? null,
    status: row.sessions.status as Status,
    revision: row.sessions.revision,
    createdAt: row.sessions.createdAt.toISOString(),
    updatedAt: row.sessions.updatedAt.toISOString(),
    ...(events ? { events } : {}),
  };
}

async function joinedSession(userId: string, sessionId: string): Promise<JoinedSession> {
  const [row] = await db
    .select()
    .from(sessions)
    .innerJoin(recipes, eq(sessions.recipeId, recipes.id))
    .innerJoin(operators, eq(sessions.operatorId, operators.id))
    .leftJoin(equipment, eq(sessions.equipmentId, equipment.id))
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
    .limit(1);
  if (!row) throw new SessionNotFoundError();
  return row;
}

export async function listOperators(): Promise<Operator[]> {
  const rows = await db.select().from(operators).orderBy(asc(operators.displayName));
  return rows.map(toOperator);
}

export async function listSessions(userId: string): Promise<Session[]> {
  const rows = await db
    .select()
    .from(sessions)
    .innerJoin(recipes, eq(sessions.recipeId, recipes.id))
    .innerJoin(operators, eq(sessions.operatorId, operators.id))
    .leftJoin(equipment, eq(sessions.equipmentId, equipment.id))
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.createdAt));
  return rows.map((row) => toSession(row));
}

export async function getSession(userId: string, sessionId: string): Promise<Session> {
  const row = await joinedSession(userId, sessionId);
  const events = await getSessionEvents(userId, sessionId);
  return toSession(row, events);
}

export async function getSessionEvents(userId: string, sessionId: string): Promise<SessionEvent[]> {
  await joinedSession(userId, sessionId);
  const rows = await db
    .select()
    .from(sessionEvents)
    .where(eq(sessionEvents.sessionId, sessionId))
    .orderBy(asc(sessionEvents.revision));
  return rows.map(toEvent);
}

export async function createSession(
  userId: string,
  input: { recipeId: string; operatorId: string; equipmentId?: number | null },
): Promise<Session> {
  const sessionId = await db.transaction(async (tx) => {
    const [recipe] = await tx
      .select({ id: recipes.id })
      .from(recipes)
      .where(and(eq(recipes.id, input.recipeId), eq(recipes.userId, userId)))
      .limit(1);
    const [operator] = await tx.select({ id: operators.id }).from(operators).where(eq(operators.id, input.operatorId)).limit(1);
    if (!recipe || !operator) throw new SessionReferenceError();

    if (input.equipmentId !== undefined && input.equipmentId !== null) {
      const [ownedEquipment] = await tx
        .select({ id: equipment.id })
        .from(equipment)
        .where(and(eq(equipment.id, input.equipmentId), eq(equipment.userId, userId)))
        .limit(1);
      if (!ownedEquipment) throw new SessionReferenceError();
    }

    const now = new Date();
    const [session] = await tx
      .insert(sessions)
      .values({
        userId,
        recipeId: input.recipeId,
        operatorId: input.operatorId,
        equipmentId: input.equipmentId ?? null,
        status: "DRAFT",
        revision: 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: sessions.id });
    if (!session) throw new Error("Session was not created.");
    await tx.insert(sessionEvents).values({
      sessionId: session.id,
      actorId: userId,
      action: "SESSION_CREATED",
      fromStatus: null,
      toStatus: "DRAFT",
      revision: 0,
      createdAt: now,
    });
    return session.id;
  });
  return getSession(userId, sessionId);
}

const transitions: Record<string, { from: Status[]; to: Status }> = {
  prepare: { from: ["DRAFT"], to: "READY" },
  start: { from: ["READY"], to: "RUNNING" },
  pause: { from: ["RUNNING"], to: "PAUSED" },
  resume: { from: ["PAUSED"], to: "RUNNING" },
  abort: { from: ["DRAFT", "READY", "RUNNING", "PAUSED"], to: "ABORTED" },
};

export async function transitionSession(
  userId: string,
  sessionId: string,
  action: string,
  input: SessionAction,
): Promise<Session> {
  const transition = transitions[action];
  if (!transition) throw new SessionInvalidTransitionError();

  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
      .limit(1);
    if (!current) throw new SessionNotFoundError();
    if (current.revision !== input.expectedRevision) throw new SessionRevisionConflictError();
    if (!transition.from.includes(current.status as Status)) throw new SessionInvalidTransitionError();

    if (action === "start") await ensureSessionSteps(tx, sessionId, current.recipeId);

    const nextRevision = current.revision + 1;
    const [updated] = await tx
      .update(sessions)
      .set({ status: transition.to, revision: nextRevision, updatedAt: new Date() })
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId), eq(sessions.revision, input.expectedRevision)))
      .returning({ id: sessions.id });
    if (!updated) throw new SessionRevisionConflictError();

    await tx.insert(sessionEvents).values({
      sessionId,
      actorId: userId,
      action: action.toUpperCase(),
      fromStatus: current.status,
      toStatus: transition.to,
      revision: nextRevision,
    });
  });
  return getSession(userId, sessionId);
}

type SessionStepRow = {
  sessionStep: typeof sessionSteps.$inferSelect;
  recipeStep: typeof recipeSteps.$inferSelect;
};

type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function ensureSessionSteps(tx: DatabaseTransaction, sessionId: string, recipeId: string): Promise<void> {
  const steps = await tx
    .select()
    .from(recipeSteps)
    .where(eq(recipeSteps.recipeId, recipeId))
    .orderBy(asc(recipeSteps.stepOrder));
  if (!steps.length) throw new SessionInvalidTransitionError();
  await tx.insert(sessionSteps).values(
    steps.map((step: typeof recipeSteps.$inferSelect) => ({
      sessionId,
      recipeStepId: step.id,
      stepOrder: step.stepOrder,
      status: "PENDING",
    })),
  ).onConflictDoNothing();
}

function toProgress(current: typeof sessions.$inferSelect, rows: SessionStepRow[]): SessionProgress {
  const steps = rows.map(({ sessionStep, recipeStep }) => ({
    id: sessionStep.id,
    recipeStepId: recipeStep.id,
    stepOrder: sessionStep.stepOrder,
    label: recipeStep.label,
    description: recipeStep.description,
    status: sessionStep.status as "PENDING" | "COMPLETED",
    completedAt: sessionStep.completedAt?.toISOString() ?? null,
  }));
  const nextStep = steps.find((step) => step.status === "PENDING") ?? null;
  return {
    id: current.id,
    status: current.status as SessionStatus,
    revision: current.revision,
    completedSteps: steps.filter((step) => step.status === "COMPLETED").length,
    totalSteps: steps.length,
    steps,
    nextStep,
    availableActions: current.status === "RUNNING" && nextStep ? ["CAUTIOUS", "BALANCED", "BOLD"] : [],
  };
}

async function progressRows(tx: DatabaseTransaction, sessionId: string): Promise<SessionStepRow[]> {
  return tx
    .select({ sessionStep: sessionSteps, recipeStep: recipeSteps })
    .from(sessionSteps)
    .innerJoin(recipeSteps, eq(sessionSteps.recipeStepId, recipeSteps.id))
    .where(eq(sessionSteps.sessionId, sessionId))
    .orderBy(asc(sessionSteps.stepOrder));
}

export async function getSessionProgress(userId: string, sessionId: string): Promise<SessionProgress> {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
      .limit(1);
    if (!current) throw new SessionNotFoundError();
    await ensureSessionSteps(tx, sessionId, current.recipeId);
    return toProgress(current, await progressRows(tx, sessionId));
  });
}

export async function advanceSession(userId: string, sessionId: string, input: SessionAdvance): Promise<{ progress: SessionProgress; outcome: TurnOutcome }> {
  const outcome = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
      .limit(1);
    if (!current) throw new SessionNotFoundError();
    if (current.revision !== input.expectedRevision) throw new SessionRevisionConflictError();
    if (current.status !== "RUNNING") throw new SessionInvalidTransitionError();

    await ensureSessionSteps(tx, sessionId, current.recipeId);
    const rows = await progressRows(tx, sessionId);
    const next = rows.find(({ sessionStep }) => sessionStep.status === "PENDING");
    if (!next) throw new SessionInvalidTransitionError();

    let equipmentAvailable = false;
    if (current.equipmentId !== null) {
      const [selectedEquipment] = await tx
        .select({ available: equipment.available })
        .from(equipment)
        .where(eq(equipment.id, current.equipmentId))
        .limit(1);
      equipmentAvailable = selectedEquipment?.available === true;
    }
    const probability = calculateTurnProbability(input.action, equipmentAvailable);
    const success = randomSource() < probability.effective / 100;
    const nextStatus: Status = success && next.sessionStep.stepOrder === rows.length ? "COMPLETED" : success ? "RUNNING" : "FAILED";
    const nextRevision = current.revision + 1;
    const [updated] = await tx
      .update(sessions)
      .set({ status: nextStatus, revision: nextRevision, updatedAt: new Date() })
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId), eq(sessions.revision, input.expectedRevision)))
      .returning({ id: sessions.id });
    if (!updated) throw new SessionRevisionConflictError();

    if (success) {
      await tx.update(sessionSteps)
        .set({ status: "COMPLETED", completedAt: new Date() })
        .where(and(eq(sessionSteps.id, next.sessionStep.id), eq(sessionSteps.status, "PENDING")));
    }

    await tx.insert(sessionEvents).values({
      sessionId,
      actorId: userId,
      action: success ? "TURN_SUCCEEDED" : "TURN_FAILED",
      fromStatus: current.status,
      toStatus: nextStatus,
      revision: nextRevision,
      metadata: {
        action: input.action,
        stepOrder: next.sessionStep.stepOrder,
        stepId: next.recipeStep.id,
        equipmentModifier: probability.equipmentModifier,
        effectiveProbability: probability.effective,
        success,
      },
    });
    return {
      action: input.action,
      stepOrder: next.sessionStep.stepOrder,
      success,
      equipmentModifier: probability.equipmentModifier,
      effectiveProbability: probability.effective,
    } satisfies TurnOutcome;
  });

  return { progress: await getSessionProgress(userId, sessionId), outcome };
}
