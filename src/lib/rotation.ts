import { weeksBetween } from "./weeks";

export type RotationArea = {
  intervalWeeks: number;
  startWeek: string;
  /** Bruker-id-er i rotasjonsrekkefølge. */
  memberIds: string[];
};

/** En overstyring: userId = ny ansvarlig, null = ingen vask. */
export type WeekOverride = { userId: string | null };

export type Assignment =
  | { kind: "user"; userId: string; overridden: boolean }
  | { kind: "skipped" }
  | { kind: "none" };

/** Hvem rotasjonen sier har ansvaret en gitt uke, uten overstyringer. */
export function rotationAssignee(area: RotationArea, week: string): string | null {
  const count = area.memberIds.length;
  if (count === 0) return null;

  const weeks = weeksBetween(area.startWeek, week);
  if (weeks < 0) return null;

  const period = Math.floor(weeks / Math.max(1, area.intervalWeeks));
  return area.memberIds[period % count];
}

/** Hvem som faktisk har ansvaret en gitt uke, med overstyringer. */
export function assignmentFor(
  area: RotationArea,
  week: string,
  override: WeekOverride | undefined,
): Assignment {
  if (override) {
    return override.userId
      ? { kind: "user", userId: override.userId, overridden: true }
      : { kind: "skipped" };
  }
  const userId = rotationAssignee(area, week);
  return userId ? { kind: "user", userId, overridden: false } : { kind: "none" };
}
