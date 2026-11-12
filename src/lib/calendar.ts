import "server-only";
import { and, asc, count, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { calendarCategories, calendarEvents } from "@/db/schema";
import { DEFAULT_CATEGORIES, categoryColor } from "./calendar-colors";

export type CalendarCategory = typeof calendarCategories.$inferSelect;
export type CalendarEvent = typeof calendarEvents.$inferSelect;

/** Lager standardkategoriene første gang kalenderen brukes. */
async function ensureDefaultCategories() {
  const [row] = await db.select({ value: count() }).from(calendarCategories);
  if ((row?.value ?? 0) > 0) return;
  await db
    .insert(calendarCategories)
    .values(DEFAULT_CATEGORIES.map((c, position) => ({ ...c, position })));
}

export async function listCategories(): Promise<CalendarCategory[]> {
  await ensureDefaultCategories();
  return db.select().from(calendarCategories).orderBy(asc(calendarCategories.position), asc(calendarCategories.name));
}

/** Hendelser som overlapper datoene fra–til (begge inkludert). */
export async function getEventsInRange(from: string, to: string): Promise<CalendarEvent[]> {
  return db
    .select()
    .from(calendarEvents)
    .where(and(lte(calendarEvents.startDate, to), gte(calendarEvents.endDate, from)))
    .orderBy(asc(calendarEvents.startDate), asc(calendarEvents.startTime), asc(calendarEvents.title));
}

export async function getEvent(id: string) {
  return db.query.calendarEvents.findFirst({ where: eq(calendarEvents.id, id) });
}

/** Neste hendelser fra og med en dato. */
export async function getUpcomingEvents(from: string, limit = 3) {
  return db
    .select()
    .from(calendarEvents)
    .where(gte(calendarEvents.endDate, from))
    .orderBy(asc(calendarEvents.startDate), asc(calendarEvents.startTime))
    .limit(limit);
}

/** Hendelsene som gjelder en bestemt dag, heldags først og så etter klokkeslett. */
export function eventsOnDay(events: CalendarEvent[], day: string) {
  return events
    .filter((e) => e.startDate <= day && e.endDate >= day)
    .sort((a, b) => {
      const aTime = a.startDate < day || !a.startTime ? "" : a.startTime;
      const bTime = b.startDate < day || !b.startTime ? "" : b.startTime;
      return aTime.localeCompare(bTime) || a.title.localeCompare(b.title);
    });
}

/** Farger for en hendelse ut fra kategorien. */
export function colorsFor(event: CalendarEvent, categories: Map<string, CalendarCategory>) {
  const category = event.categoryId ? categories.get(event.categoryId) : undefined;
  return { ...categoryColor(category?.color), categoryName: category?.name ?? null };
}
