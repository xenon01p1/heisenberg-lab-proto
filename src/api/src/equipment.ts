import { and, asc, eq } from "drizzle-orm";
import { db, equipment } from "@heisenberg/db";
import type { Equipment, EquipmentInput } from "@heisenberg/contracts";

export class EquipmentNotFoundError extends Error {}

function toEquipment(item: typeof equipment.$inferSelect): Equipment {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    condition: item.condition,
    available: item.available,
    createdAt: item.createdAt.toISOString(),
  };
}

export async function listEquipment(userId: string): Promise<Equipment[]> {
  const records = await db
    .select()
    .from(equipment)
    .where(eq(equipment.userId, userId))
    .orderBy(asc(equipment.name), asc(equipment.id));
  return records.map(toEquipment);
}

export async function getEquipment(userId: string, equipmentId: number): Promise<Equipment> {
  const [item] = await db
    .select()
    .from(equipment)
    .where(and(eq(equipment.id, equipmentId), eq(equipment.userId, userId)))
    .limit(1);
  if (!item) throw new EquipmentNotFoundError();
  return toEquipment(item);
}

export async function createEquipment(userId: string, input: EquipmentInput): Promise<Equipment> {
  const [item] = await db
    .insert(equipment)
    .values({ userId, ...input })
    .returning();
  if (!item) throw new Error("Equipment was not created.");
  return toEquipment(item);
}

export async function updateEquipment(
  userId: string,
  equipmentId: number,
  input: EquipmentInput,
): Promise<Equipment> {
  const [item] = await db
    .update(equipment)
    .set(input)
    .where(and(eq(equipment.id, equipmentId), eq(equipment.userId, userId)))
    .returning();
  if (!item) throw new EquipmentNotFoundError();
  return toEquipment(item);
}

export async function deleteEquipment(userId: string, equipmentId: number): Promise<void> {
  const deleted = await db
    .delete(equipment)
    .where(and(eq(equipment.id, equipmentId), eq(equipment.userId, userId)))
    .returning({ id: equipment.id });
  if (!deleted.length) throw new EquipmentNotFoundError();
}
