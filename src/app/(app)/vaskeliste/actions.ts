"use server";

import { and, eq, inArray, max } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  cleaningAreaMembers,
  cleaningAreas,
  cleaningCompletions,
  cleaningTaskChecks,
  cleaningTasks,
  cleaningWeekOverrides,
  users,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { currentWeek, isWeek } from "@/lib/weeks";

// Alle beboere kan gjøre alt, men man må være innlogget.
// Hver action sjekker innloggingen selv og validerer input fra skjemaet.

function text(formData: FormData, key: string, maxLength = 80) {
  return String(formData.get(key) ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

async function requireArea(areaId: string) {
  const area = await db.query.cleaningAreas.findFirst({ where: eq(cleaningAreas.id, areaId) });
  if (!area) throw new Error("Fant ikke området.");
  return area;
}

async function requireResident(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new Error("Fant ikke beboeren.");
}

function requireWeek(week: string) {
  if (!isWeek(week)) throw new Error("Ugyldig uke.");
}

// --- Avkrysning --------------------------------------------------------------

export async function setAreaDone(areaId: string, week: string, done: boolean) {
  const user = await getCurrentUser();
  requireWeek(week);
  await requireArea(areaId);

  if (done) {
    await db
      .insert(cleaningCompletions)
      .values({ areaId, week, userId: user.id })
      .onConflictDoNothing();
  } else {
    await db
      .delete(cleaningCompletions)
      .where(and(eq(cleaningCompletions.areaId, areaId), eq(cleaningCompletions.week, week)));
  }
  refresh();
}

export async function setTaskChecked(taskId: string, week: string, checked: boolean) {
  const user = await getCurrentUser();
  requireWeek(week);

  if (checked) {
    const task = await db.query.cleaningTasks.findFirst({ where: eq(cleaningTasks.id, taskId) });
    if (!task) throw new Error("Fant ikke punktet.");
    await db
      .insert(cleaningTaskChecks)
      .values({ taskId, week, userId: user.id })
      .onConflictDoNothing();
  } else {
    await db
      .delete(cleaningTaskChecks)
      .where(and(eq(cleaningTaskChecks.taskId, taskId), eq(cleaningTaskChecks.week, week)));
  }
  refresh();
}

// --- Områder -----------------------------------------------------------------

export async function createArea(formData: FormData) {
  await getCurrentUser();
  const name = text(formData, "name", 40);
  if (!name) return;

  const [{ maxPosition }] = await db
    .select({ maxPosition: max(cleaningAreas.position) })
    .from(cleaningAreas);

  const [area] = await db
    .insert(cleaningAreas)
    .values({ name, startWeek: currentWeek(), position: (maxPosition ?? -1) + 1 })
    .returning({ id: cleaningAreas.id });

  // Som standard er alle beboere med, i den rekkefølgen de registrerte seg.
  const residents = await db.select({ id: users.id }).from(users).orderBy(users.createdAt);
  if (residents.length > 0) {
    await db
      .insert(cleaningAreaMembers)
      .values(residents.map((r, position) => ({ areaId: area.id, userId: r.id, position })));
  }

  redirect(`/vaskeliste/innstillinger/${area.id}`);
}

export async function renameArea(areaId: string, formData: FormData) {
  await getCurrentUser();
  await requireArea(areaId);
  const name = text(formData, "name", 40);
  if (!name) return;
  await db.update(cleaningAreas).set({ name }).where(eq(cleaningAreas.id, areaId));
  refresh();
}

export async function updateRotation(areaId: string, formData: FormData) {
  await getCurrentUser();
  await requireArea(areaId);

  const intervalWeeks = Number(formData.get("intervalWeeks"));
  const startWeek = String(formData.get("startWeek") ?? "");
  if (![1, 2, 3].includes(intervalWeeks)) throw new Error("Ugyldig frekvens.");
  requireWeek(startWeek);

  await db
    .update(cleaningAreas)
    .set({ intervalWeeks, startWeek })
    .where(eq(cleaningAreas.id, areaId));
  refresh();
}

export async function deleteArea(areaId: string) {
  await getCurrentUser();
  await requireArea(areaId);

  // Slett alt som hører til området eksplisitt, så vi ikke er avhengige av at
  // SQLite har foreign keys slått på.
  const tasks = await db
    .select({ id: cleaningTasks.id })
    .from(cleaningTasks)
    .where(eq(cleaningTasks.areaId, areaId));
  const taskIds = tasks.map((t) => t.id);
  await db.batch([
    db.delete(cleaningTaskChecks).where(inArray(cleaningTaskChecks.taskId, taskIds)),
    db.delete(cleaningTasks).where(eq(cleaningTasks.areaId, areaId)),
    db.delete(cleaningCompletions).where(eq(cleaningCompletions.areaId, areaId)),
    db.delete(cleaningWeekOverrides).where(eq(cleaningWeekOverrides.areaId, areaId)),
    db.delete(cleaningAreaMembers).where(eq(cleaningAreaMembers.areaId, areaId)),
    db.delete(cleaningAreas).where(eq(cleaningAreas.id, areaId)),
  ]);

  redirect("/vaskeliste/innstillinger");
}

// --- Deltakere i rotasjonen ---------------------------------------------------

async function memberIds(areaId: string) {
  const rows = await db
    .select({ userId: cleaningAreaMembers.userId })
    .from(cleaningAreaMembers)
    .where(eq(cleaningAreaMembers.areaId, areaId))
    .orderBy(cleaningAreaMembers.position);
  return rows.map((r) => r.userId);
}

/** Lagrer en ny rekkefølge ved å skrive alle posisjonene på nytt. */
async function saveMembers(areaId: string, ids: string[]) {
  await db.batch([
    db.delete(cleaningAreaMembers).where(eq(cleaningAreaMembers.areaId, areaId)),
    ...ids.map((userId, position) =>
      db.insert(cleaningAreaMembers).values({ areaId, userId, position }),
    ),
  ]);
}

export async function addMember(areaId: string, userId: string) {
  await getCurrentUser();
  await requireArea(areaId);
  await requireResident(userId);
  const ids = await memberIds(areaId);
  if (!ids.includes(userId)) await saveMembers(areaId, [...ids, userId]);
  refresh();
}

export async function removeMember(areaId: string, userId: string) {
  await getCurrentUser();
  await requireArea(areaId);
  const ids = await memberIds(areaId);
  await saveMembers(
    areaId,
    ids.filter((id) => id !== userId),
  );
  refresh();
}

export async function moveMember(areaId: string, userId: string, direction: -1 | 1) {
  await getCurrentUser();
  await requireArea(areaId);
  const ids = await memberIds(areaId);
  const from = ids.indexOf(userId);
  const to = from + direction;
  if (from === -1 || to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  await saveMembers(areaId, ids);
  refresh();
}

// --- Huskeliste ---------------------------------------------------------------

export async function addTask(areaId: string, formData: FormData) {
  await getCurrentUser();
  await requireArea(areaId);
  const taskText = text(formData, "text", 80);
  if (!taskText) return;

  const [{ maxPosition }] = await db
    .select({ maxPosition: max(cleaningTasks.position) })
    .from(cleaningTasks)
    .where(eq(cleaningTasks.areaId, areaId));

  await db
    .insert(cleaningTasks)
    .values({ areaId, text: taskText, position: (maxPosition ?? -1) + 1 });
  refresh();
}

export async function deleteTask(taskId: string) {
  await getCurrentUser();
  await db.batch([
    db.delete(cleaningTaskChecks).where(eq(cleaningTaskChecks.taskId, taskId)),
    db.delete(cleaningTasks).where(eq(cleaningTasks.id, taskId)),
  ]);
  refresh();
}

// --- Enkeltuker ---------------------------------------------------------------

/**
 * value = "rotation" → følg rotasjonen (fjern overstyring)
 * value = "skip"     → ingen vask denne uka
 * value = <bruker-id> → denne personen har ansvaret
 */
export async function setWeekOverride(areaId: string, week: string, value: string) {
  await getCurrentUser();
  await requireArea(areaId);
  requireWeek(week);

  const where = and(
    eq(cleaningWeekOverrides.areaId, areaId),
    eq(cleaningWeekOverrides.week, week),
  );

  if (value === "rotation") {
    await db.delete(cleaningWeekOverrides).where(where);
  } else {
    const userId = value === "skip" ? null : value;
    if (userId) await requireResident(userId);
    await db
      .insert(cleaningWeekOverrides)
      .values({ areaId, week, userId })
      .onConflictDoUpdate({
        target: [cleaningWeekOverrides.areaId, cleaningWeekOverrides.week],
        set: { userId },
      });
  }
  refresh();
}
