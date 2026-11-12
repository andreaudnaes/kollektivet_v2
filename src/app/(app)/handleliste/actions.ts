"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { invalidateAll } from "@/lib/revalidate";
import { db } from "@/db";
import { shoppingItems } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export type AddItemState = { error?: string; ok?: number } | undefined;

function clean(value: FormDataEntryValue | null, maxLength: number) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength);
  return text || null;
}

export async function addItem(prev: AddItemState, formData: FormData): Promise<AddItemState> {
  const user = await getCurrentUser();
  const rawName = clean(formData.get("name"), 60);
  if (!rawName) return { error: "Skriv inn hva som skal kjøpes." };
  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const existing = await db.query.shoppingItems.findFirst({
    where: and(isNull(shoppingItems.boughtAt), sql`lower(${shoppingItems.name}) = ${name.toLowerCase()}`),
  });
  if (existing) return { error: `${existing.name} står allerede på lista.` };

  await db.insert(shoppingItems).values({
    name,
    quantity: clean(formData.get("quantity"), 30),
    note: clean(formData.get("note"), 80),
    addedBy: user.id,
  });
  invalidateAll();
  // ok endres hver gang, så skjemaet vet at det skal tømmes.
  return { ok: (prev?.ok ?? 0) + 1 };
}

export async function setBought(itemId: string, bought: boolean) {
  const user = await getCurrentUser();
  await db
    .update(shoppingItems)
    .set(bought ? { boughtBy: user.id, boughtAt: new Date() } : { boughtBy: null, boughtAt: null })
    .where(eq(shoppingItems.id, itemId));
  invalidateAll();
}

export async function deleteItem(itemId: string) {
  await getCurrentUser();
  await db.delete(shoppingItems).where(eq(shoppingItems.id, itemId));
  invalidateAll();
}
