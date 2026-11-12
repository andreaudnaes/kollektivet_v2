"use server";

import { eq, max } from "drizzle-orm";
import { invalidateAll } from "@/lib/revalidate";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { calendarCategories, calendarEvents } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isCategoryColorId } from "@/lib/calendar-colors";
import { isDate, isTime } from "@/lib/dates";

export type EventFormState = { error?: string } | undefined;

function text(formData: FormData, key: string, maxLength: number) {
  const value = String(formData.get(key) ?? "").trim().slice(0, maxLength);
  return value || null;
}

/** Leser og validerer skjemaet for en hendelse. Gir feilmelding eller ferdige verdier. */
async function readEvent(formData: FormData) {
  const title = text(formData, "title", 80);
  if (!title) return { error: "Gi hendelsen en tittel." } as const;

  const allDay = formData.get("allDay") === "on";
  const startDate = String(formData.get("startDate") ?? "");
  let endDate = String(formData.get("endDate") ?? "") || startDate;
  if (!isDate(startDate)) return { error: "Velg en gyldig startdato." } as const;
  if (!isDate(endDate)) endDate = startDate;

  let startTime: string | null = null;
  let endTime: string | null = null;
  if (!allDay) {
    startTime = String(formData.get("startTime") ?? "");
    endTime = String(formData.get("endTime") ?? "") || null;
    if (!isTime(startTime)) return { error: "Velg et starttidspunkt, eller huk av «Hele dagen»." } as const;
    if (endTime && !isTime(endTime)) endTime = null;
  }

  if (endDate < startDate) return { error: "Sluttdatoen kan ikke være før startdatoen." } as const;
  if (endDate === startDate && startTime && endTime && endTime <= startTime) {
    return { error: "Sluttiden må være etter starttiden." } as const;
  }

  let categoryId = text(formData, "categoryId", 64);
  if (categoryId) {
    const category = await db.query.calendarCategories.findFirst({
      where: eq(calendarCategories.id, categoryId),
    });
    if (!category) categoryId = null;
  }

  return {
    values: {
      title,
      description: text(formData, "description", 500),
      categoryId,
      startDate,
      startTime,
      endDate,
      endTime,
    },
  } as const;
}

export async function createEvent(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  const user = await getCurrentUser();
  const result = await readEvent(formData);
  if ("error" in result) return { error: result.error };

  await db.insert(calendarEvents).values({ ...result.values, createdBy: user.id });
  invalidateAll();
  redirect(`/kalender?visning=dag&dato=${result.values.startDate}`);
}

export async function updateEvent(
  eventId: string,
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await getCurrentUser();
  const result = await readEvent(formData);
  if ("error" in result) return { error: result.error };

  await db.update(calendarEvents).set(result.values).where(eq(calendarEvents.id, eventId));
  invalidateAll();
  redirect(`/kalender?visning=dag&dato=${result.values.startDate}`);
}

export async function deleteEvent(eventId: string, returnDate: string) {
  await getCurrentUser();
  await db.delete(calendarEvents).where(eq(calendarEvents.id, eventId));
  invalidateAll();
  redirect(`/kalender?visning=dag&dato=${isDate(returnDate) ? returnDate : ""}`);
}

// --- Kategorier ---------------------------------------------------------------

export async function createCategory(formData: FormData) {
  await getCurrentUser();
  const name = text(formData, "name", 30);
  const color = String(formData.get("color") ?? "");
  if (!name || !isCategoryColorId(color)) return;

  const [{ maxPosition }] = await db
    .select({ maxPosition: max(calendarCategories.position) })
    .from(calendarCategories);
  await db.insert(calendarCategories).values({ name, color, position: (maxPosition ?? -1) + 1 });
  invalidateAll();
}

export async function updateCategory(categoryId: string, formData: FormData) {
  await getCurrentUser();
  const name = text(formData, "name", 30);
  const color = String(formData.get("color") ?? "");
  if (!name || !isCategoryColorId(color)) return;
  await db.update(calendarCategories).set({ name, color }).where(eq(calendarCategories.id, categoryId));
  invalidateAll();
}

export async function deleteCategory(categoryId: string) {
  await getCurrentUser();
  // Hendelsene beholdes, men mister kategorien (blir grå).
  await db.batch([
    db.update(calendarEvents).set({ categoryId: null }).where(eq(calendarEvents.categoryId, categoryId)),
    db.delete(calendarCategories).where(eq(calendarCategories.id, categoryId)),
  ]);
  invalidateAll();
}
