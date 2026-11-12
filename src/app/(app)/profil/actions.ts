"use server";

import { eq } from "drizzle-orm";
import { invalidateAll } from "@/lib/revalidate";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isAccentColorId } from "@/lib/colors";

export async function setColor(color: string) {
  const user = await getCurrentUser();
  if (!isAccentColorId(color)) throw new Error("Ugyldig farge.");
  await db.update(users).set({ color }).where(eq(users.id, user.id));
  invalidateAll();
}
