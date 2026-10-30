import { equipmentListResponseSchema, equipmentResponseSchema, type Equipment } from "@heisenberg/contracts";

export function equipmentFromPayload(payload: unknown): Equipment[] | null {
  const parsed = equipmentListResponseSchema.safeParse(payload);
  return parsed.success ? parsed.data.data : null;
}

export function equipmentItemFromPayload(payload: unknown): Equipment | null {
  const parsed = equipmentResponseSchema.safeParse(payload);
  return parsed.success ? parsed.data.data : null;
}
