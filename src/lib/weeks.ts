// Hjelpefunksjoner for uker. En uke identifiseres med mandagens dato som "YYYY-MM-DD".
// All dato-matte gjøres i UTC på rene datoer, så sommertid ikke kan forskyve noe.

const DAY_MS = 24 * 60 * 60 * 1000;
const TIME_ZONE = "Europe/Oslo";
const MONTHS = ["jan.", "feb.", "mars", "apr.", "mai", "juni", "juli", "aug.", "sep.", "okt.", "nov.", "des."];

function parse(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function format(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Dagens dato i Norge, som "YYYY-MM-DD". */
export function todayInOslo(now = new Date()): string {
  // sv-SE gir formatet YYYY-MM-DD.
  return now.toLocaleDateString("sv-SE", { timeZone: TIME_ZONE });
}

/** Mandagen i uka som inneholder datoen. */
export function weekOf(date: string): string {
  const d = parse(date);
  const daysSinceMonday = (d.getUTCDay() + 6) % 7;
  return format(new Date(d.getTime() - daysSinceMonday * DAY_MS));
}

/** Mandagen denne uka (i Norge). */
export function currentWeek(now = new Date()): string {
  return weekOf(todayInOslo(now));
}

export function addWeeks(week: string, count: number): string {
  return format(new Date(parse(week).getTime() + count * 7 * DAY_MS));
}

/** Antall hele uker fra `from` til `to` (kan være negativt). */
export function weeksBetween(from: string, to: string): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / (7 * DAY_MS));
}

/** ISO-ukenummer, f.eks. 46. */
export function weekNumber(week: string): number {
  const d = parse(week);
  // Torsdagen i uka avgjør hvilket år uka hører til.
  const thursday = new Date(d.getTime() + 3 * DAY_MS);
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  return Math.floor((thursday.getTime() - yearStart) / DAY_MS / 7) + 1;
}

/** F.eks. "9.–15. nov." */
export function weekRangeLabel(week: string): string {
  const start = parse(week);
  const end = new Date(start.getTime() + 6 * DAY_MS);
  const month = (d: Date) => MONTHS[d.getUTCMonth()];
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  return start.getUTCMonth() === end.getUTCMonth()
    ? `${startDay}.–${endDay}. ${month(end)}`
    : `${startDay}. ${month(start)}–${endDay}. ${month(end)}`;
}

export function isWeek(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parse(value).getTime()) && weekOf(value) === value;
}
