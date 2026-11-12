import "server-only";
import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
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
import { assignmentFor, type Assignment, type RotationArea } from "./rotation";
import { addWeeks } from "./weeks";

export type Resident = { id: string; name: string };

export async function listResidents(): Promise<Resident[]> {
  return db
    .select({ id: users.id, name: users.name })
    .from(users)
    .orderBy(asc(users.createdAt));
}

type AreaRow = typeof cleaningAreas.$inferSelect;

export type AreaWithRotation = AreaRow &
  RotationArea & {
    tasks: { id: string; text: string }[];
    /** Overstyringer i det forespurte tidsrommet, per uke. */
    overrides: Map<string, { userId: string | null }>;
  };

/** Henter alle områder med deltakere, huskeliste og overstyringer for ukene fra–til. */
export async function getAreas(fromWeek: string, toWeek: string): Promise<AreaWithRotation[]> {
  const areas = await db
    .select()
    .from(cleaningAreas)
    .orderBy(asc(cleaningAreas.position), asc(cleaningAreas.createdAt));
  if (areas.length === 0) return [];

  const areaIds = areas.map((a) => a.id);
  const [members, tasks, overrides] = await Promise.all([
    db
      .select()
      .from(cleaningAreaMembers)
      .where(inArray(cleaningAreaMembers.areaId, areaIds))
      .orderBy(asc(cleaningAreaMembers.position)),
    db
      .select()
      .from(cleaningTasks)
      .where(inArray(cleaningTasks.areaId, areaIds))
      .orderBy(asc(cleaningTasks.position)),
    db
      .select()
      .from(cleaningWeekOverrides)
      .where(
        and(
          inArray(cleaningWeekOverrides.areaId, areaIds),
          gte(cleaningWeekOverrides.week, fromWeek),
          lte(cleaningWeekOverrides.week, toWeek),
        ),
      ),
  ]);

  return areas.map((area) => ({
    ...area,
    memberIds: members.filter((m) => m.areaId === area.id).map((m) => m.userId),
    tasks: tasks.filter((t) => t.areaId === area.id).map(({ id, text }) => ({ id, text })),
    overrides: new Map(
      overrides.filter((o) => o.areaId === area.id).map((o) => [o.week, { userId: o.userId }]),
    ),
  }));
}

export function assignmentForWeek(area: AreaWithRotation, week: string): Assignment {
  return assignmentFor(area, week, area.overrides.get(week));
}

/** Avkrysninger (områder og huskelistepunkter) for én uke. */
export async function getWeekProgress(week: string) {
  const [completions, checks] = await Promise.all([
    db.select().from(cleaningCompletions).where(eq(cleaningCompletions.week, week)),
    db.select().from(cleaningTaskChecks).where(eq(cleaningTaskChecks.week, week)),
  ]);
  return {
    completions: new Map(completions.map((c) => [c.areaId, c])),
    checks: new Map(checks.map((c) => [c.taskId, c])),
  };
}

/** Alt som trengs på innstillingssiden for ett område. */
export async function getAreaSettings(areaId: string, fromWeek: string, weeks: number) {
  const area = await db.query.cleaningAreas.findFirst({ where: eq(cleaningAreas.id, areaId) });
  if (!area) return null;

  const toWeek = addWeeks(fromWeek, weeks - 1);
  const [members, tasks, overrides, residents] = await Promise.all([
    db
      .select()
      .from(cleaningAreaMembers)
      .where(eq(cleaningAreaMembers.areaId, areaId))
      .orderBy(asc(cleaningAreaMembers.position)),
    db
      .select()
      .from(cleaningTasks)
      .where(eq(cleaningTasks.areaId, areaId))
      .orderBy(asc(cleaningTasks.position)),
    db
      .select()
      .from(cleaningWeekOverrides)
      .where(
        and(
          eq(cleaningWeekOverrides.areaId, areaId),
          gte(cleaningWeekOverrides.week, fromWeek),
          lte(cleaningWeekOverrides.week, toWeek),
        ),
      ),
    listResidents(),
  ]);

  return {
    area: {
      ...area,
      memberIds: members.map((m) => m.userId),
      tasks: tasks.map(({ id, text }) => ({ id, text })),
      overrides: new Map(overrides.map((o) => [o.week, { userId: o.userId }])),
    } satisfies AreaWithRotation,
    residents,
  };
}
