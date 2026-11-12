import "server-only";
import { and, asc, count, desc, gte, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { shoppingItems } from "@/db/schema";

/** Hvor lenge kjøpte varer vises under «Handlet» før de skjules. */
export const BOUGHT_VISIBLE_DAYS = 3;

export type ShoppingItem = typeof shoppingItems.$inferSelect;

export async function getShoppingList() {
  const since = new Date(Date.now() - BOUGHT_VISIBLE_DAYS * 24 * 60 * 60 * 1000);
  const [open, bought] = await Promise.all([
    db
      .select()
      .from(shoppingItems)
      .where(isNull(shoppingItems.boughtAt))
      .orderBy(asc(shoppingItems.createdAt)),
    db
      .select()
      .from(shoppingItems)
      .where(and(isNotNull(shoppingItems.boughtAt), gte(shoppingItems.boughtAt, since)))
      .orderBy(desc(shoppingItems.boughtAt)),
  ]);
  return { open, bought };
}

export async function countOpenItems() {
  const [row] = await db
    .select({ value: count() })
    .from(shoppingItems)
    .where(isNull(shoppingItems.boughtAt));
  return row?.value ?? 0;
}

/** Varenavn som er brukt før, de mest brukte først. Til forslag når man skriver. */
export async function getSuggestions(limit = 200) {
  const key = sql<string>`lower(${shoppingItems.name})`;
  const rows = await db
    .select({ name: sql<string>`max(${shoppingItems.name})`, uses: count() })
    .from(shoppingItems)
    .groupBy(key)
    .orderBy(desc(count()))
    .limit(limit);
  return rows.map((r) => r.name);
}
