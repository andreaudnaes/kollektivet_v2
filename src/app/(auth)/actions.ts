"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { invalidateAll } from "@/lib/revalidate";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPin, safeEqual, verifyPin } from "@/lib/pin";
import { createSession, deleteSession } from "@/lib/session";

export type FormState = { error?: string; name?: string } | undefined;

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function readForm(formData: FormData) {
  const name = normalizeName(String(formData.get("name") ?? ""));
  const pin = String(formData.get("pin") ?? "");
  return { name, nameKey: name.toLowerCase(), pin };
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const { name, nameKey, pin } = readForm(formData);
  const inviteCode = String(formData.get("inviteCode") ?? "").trim();
  const expectedCode = process.env.INVITE_CODE;

  if (!expectedCode) {
    return { error: "Registrering er ikke satt opp (INVITE_CODE mangler).", name };
  }
  if (name.length < 1 || name.length > 40) {
    return { error: "Navnet må være mellom 1 og 40 tegn.", name };
  }
  if (!/^\d{4}$/.test(pin)) {
    return { error: "PIN-koden må være fire siffer.", name };
  }
  if (!safeEqual(inviteCode, expectedCode)) {
    return { error: "Feil invitasjonskode.", name };
  }

  const existing = await db.query.users.findFirst({ where: eq(users.nameKey, nameKey) });
  if (existing) {
    return { error: "Det finnes allerede en beboer med det navnet.", name };
  }

  const [user] = await db
    .insert(users)
    .values({ name, nameKey, pinHash: await hashPin(pin) })
    .returning({ id: users.id });

  await createSession(user.id);
  invalidateAll();
  redirect("/");
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const { name, nameKey, pin } = readForm(formData);
  const wrong = { error: "Feil navn eller PIN-kode.", name };

  if (!name || !/^\d{4}$/.test(pin)) return wrong;

  const user = await db.query.users.findFirst({ where: eq(users.nameKey, nameKey) });
  if (!user) return wrong;

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
    return {
      error: `For mange feil forsøk. Prøv igjen om ${minutes} ${minutes === 1 ? "minutt" : "minutter"}.`,
      name,
    };
  }

  if (!(await verifyPin(pin, user.pinHash))) {
    const failedAttempts = user.failedAttempts + 1;
    const locked = failedAttempts >= MAX_ATTEMPTS;
    await db
      .update(users)
      .set({
        failedAttempts: locked ? 0 : failedAttempts,
        lockedUntil: locked ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      })
      .where(eq(users.id, user.id));

    return locked
      ? { error: `For mange feil forsøk. Kontoen er låst i ${LOCK_MINUTES} minutter.`, name }
      : wrong;
  }

  await db
    .update(users)
    .set({ failedAttempts: 0, lockedUntil: null })
    .where(eq(users.id, user.id));

  await createSession(user.id);
  invalidateAll();
  redirect("/");
}

export async function logout() {
  await deleteSession();
  invalidateAll();
  redirect("/logg-inn");
}
