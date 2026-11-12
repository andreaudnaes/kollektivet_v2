// Datohjelpere for kalenderen. Datoer er "YYYY-MM-DD", og all matte gjøres i UTC
// på rene datoer, så tidssoner og sommertid ikke kan forskyve noe.
// Navn på dager og måneder er skrevet ut her i stedet for å bruke Intl,
// så de blir like på server og telefon.

import { weekOf } from "./weeks";

const DAY_MS = 24 * 60 * 60 * 1000;

export const WEEKDAYS = ["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag"];
export const WEEKDAYS_SHORT = ["man.", "tir.", "ons.", "tor.", "fre.", "lør.", "søn."];
export const WEEKDAY_LETTERS = ["M", "T", "O", "T", "F", "L", "S"];
export const MONTHS = [
  "januar", "februar", "mars", "april", "mai", "juni",
  "juli", "august", "september", "oktober", "november", "desember",
];
const MONTHS_SHORT = ["jan.", "feb.", "mars", "apr.", "mai", "juni", "juli", "aug.", "sep.", "okt.", "nov.", "des."];

function parse(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

function format(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function isDate(value: string | null | undefined): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(parse(value).getTime()) &&
    format(parse(value)) === value
  );
}

export function isTime(value: string | null | undefined): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function addDays(date: string, days: number) {
  return format(new Date(parse(date).getTime() + days * DAY_MS));
}

export function addMonths(date: string, months: number) {
  const d = parse(date);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  // Behold dagen, men ikke gå forbi siste dag i måneden (31. jan + 1 mnd = 28./29. feb).
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d.getUTCDate(), lastDay));
  return format(target);
}

/** 0 = mandag, 6 = søndag. */
export function weekdayIndex(date: string) {
  return (parse(date).getUTCDay() + 6) % 7;
}

export function dayOfMonth(date: string) {
  return parse(date).getUTCDate();
}

export function startOfMonth(date: string) {
  return `${date.slice(0, 8)}01`;
}

export function sameMonth(a: string, b: string) {
  return a.slice(0, 7) === b.slice(0, 7);
}

/** Alle dagene i ruten for en måned: hele uker fra mandag til søndag. */
export function monthGrid(date: string): string[][] {
  const first = startOfMonth(date);
  const start = weekOf(first);
  const nextMonth = startOfMonth(addMonths(first, 1));
  const weeks: string[][] = [];
  for (let day = start; day < nextMonth; day = addDays(day, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(day, i)));
  }
  return weeks;
}

/** De sju dagene i uka som inneholder datoen. */
export function weekDays(date: string) {
  const monday = weekOf(date);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** «november 2026» */
export function monthLabel(date: string) {
  const d = parse(date);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** «lørdag 14. november» */
export function longDateLabel(date: string) {
  const d = parse(date);
  return `${WEEKDAYS[weekdayIndex(date)]} ${d.getUTCDate()}. ${MONTHS[d.getUTCMonth()]}`;
}

/** «lør. 14. nov.» */
export function shortDateLabel(date: string) {
  const d = parse(date);
  return `${WEEKDAYS_SHORT[weekdayIndex(date)]} ${d.getUTCDate()}. ${MONTHS_SHORT[d.getUTCMonth()]}`;
}

/** «9.–15. nov.» eller «30. nov.–6. des.» */
export function rangeLabel(from: string, to: string) {
  const a = parse(from);
  const b = parse(to);
  return a.getUTCMonth() === b.getUTCMonth()
    ? `${a.getUTCDate()}.–${b.getUTCDate()}. ${MONTHS_SHORT[b.getUTCMonth()]}`
    : `${a.getUTCDate()}. ${MONTHS_SHORT[a.getUTCMonth()]}–${b.getUTCDate()}. ${MONTHS_SHORT[b.getUTCMonth()]}`;
}

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "14:30" → 870 minutter. */
export function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export type EventTiming = {
  startDate: string;
  startTime: string | null;
  endDate: string;
  endTime: string | null;
};

/** Hvordan en hendelse skal beskrives en gitt dag: «Hele dagen», «18:00–22:00», «Fra 18:00» osv. */
export function timeLabelForDay(event: EventTiming, day: string) {
  if (!event.startTime) return "Hele dagen";
  const isStart = day === event.startDate;
  const isEnd = day === event.endDate;
  if (isStart && isEnd) return event.endTime ? `${event.startTime}–${event.endTime}` : event.startTime;
  if (isStart) return `Fra ${event.startTime}`;
  if (isEnd) return event.endTime ? `Til ${event.endTime}` : "Hele dagen";
  return "Hele dagen";
}

/** Om hendelsen skal vises som heldags den dagen (i dagsvisningen). */
export function isAllDayOn(event: EventTiming, day: string) {
  if (!event.startTime) return true;
  return day !== event.startDate && day !== event.endDate;
}

/** Start og slutt i minutter for tidslinjen en gitt dag. */
export function minutesOnDay(event: EventTiming, day: string) {
  const start = day === event.startDate && event.startTime ? toMinutes(event.startTime) : 0;
  let end =
    day === event.endDate && event.endTime ? toMinutes(event.endTime) : day === event.endDate ? start + 60 : 24 * 60;
  if (end <= start) end = Math.min(start + 60, 24 * 60);
  return { start, end };
}
