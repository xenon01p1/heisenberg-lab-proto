import {
  operatorListResponseSchema,
  sessionAdvanceResponseSchema,
  sessionListResponseSchema,
  sessionProgressResponseSchema,
  sessionResponseSchema,
  type Operator,
  type Session,
  type SessionProgress,
  type TurnOutcome,
} from "@heisenberg/contracts";

export function operatorsFromPayload(payload: unknown): Operator[] | null {
  const parsed = operatorListResponseSchema.safeParse(payload);
  return parsed.success ? parsed.data.data : null;
}

export function sessionProgressFromPayload(payload: unknown): SessionProgress | null {
  const parsed = sessionProgressResponseSchema.safeParse(payload);
  return parsed.success ? parsed.data.data : null;
}

export function sessionAdvanceFromPayload(payload: unknown): { progress: SessionProgress; outcome: TurnOutcome } | null {
  const parsed = sessionAdvanceResponseSchema.safeParse(payload);
  return parsed.success ? { progress: parsed.data.data, outcome: parsed.data.data.outcome } : null;
}

export function sessionsFromPayload(payload: unknown): Session[] | null {
  const parsed = sessionListResponseSchema.safeParse(payload);
  return parsed.success ? parsed.data.data : null;
}

export function sessionFromPayload(payload: unknown): Session | null {
  const parsed = sessionResponseSchema.safeParse(payload);
  return parsed.success ? parsed.data.data : null;
}
