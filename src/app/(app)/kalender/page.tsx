import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BackIcon, ChevronIcon, PlusIcon, SlidersIcon } from "@/components/icons";
import { Page, ui } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getEventsInRange, listCategories } from "@/lib/calendar";
import {
  addDays,
  addMonths,
  capitalize,
  isDate,
  longDateLabel,
  monthGrid,
  monthLabel,
  rangeLabel,
  toMinutes,
  weekDays,
} from "@/lib/dates";
import { todayInOslo, weekNumber } from "@/lib/weeks";
import { DayView, MonthView, WeekView } from "./views";

export const metadata: Metadata = { title: "Kalender – Kollektivet" };

type View = "dag" | "uke" | "maned";
const VIEWS: { id: View; label: string }[] = [
  { id: "dag", label: "Dag" },
  { id: "uke", label: "Uke" },
  { id: "maned", label: "Måned" },
];

export default function CalendarPage({ searchParams }: PageProps<"/kalender">) {
  return (
    <Page>
      <Suspense fallback={<p className="pt-24 text-gray-500">Henter kalenderen …</p>}>
        <Calendar searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function Calendar({ searchParams }: { searchParams: PageProps<"/kalender">["searchParams"] }) {
  await getCurrentUser();
  const params = await searchParams;
  const today = todayInOslo();
  const view: View = VIEWS.some((v) => v.id === params.visning) ? (params.visning as View) : "maned";
  const date = typeof params.dato === "string" && isDate(params.dato) ? params.dato : today;

  // Hvilke datoer som vises, og hvor pilene fører.
  let from: string;
  let to: string;
  let label: string;
  let prev: string;
  let next: string;
  if (view === "dag") {
    from = to = date;
    label = capitalize(longDateLabel(date));
    prev = addDays(date, -1);
    next = addDays(date, 1);
  } else if (view === "uke") {
    const days = weekDays(date);
    from = days[0];
    to = days[6];
    label = `Uke ${weekNumber(from)} · ${rangeLabel(from, to)}`;
    prev = addDays(date, -7);
    next = addDays(date, 7);
  } else {
    const grid = monthGrid(date);
    from = grid[0][0];
    to = grid.at(-1)!.at(-1)!;
    label = capitalize(monthLabel(date));
    prev = addMonths(date, -1);
    next = addMonths(date, 1);
  }

  const [events, categoryList] = await Promise.all([getEventsInRange(from, to), listCategories()]);
  const categories = new Map(categoryList.map((c) => [c.id, c]));
  const href = (v: View, d: string) => `/kalender?visning=${v}&dato=${d}`;
  const nowMinutes = toMinutes(
    new Date().toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Oslo" }),
  );

  return (
    <>
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-[30px] font-bold tracking-[-0.02em]">Kalender</h1>
          <Link href="/kalender/kategorier" aria-label="Kategorier og farger" className={ui.iconButton}>
            <SlidersIcon />
          </Link>
        </div>

        <nav aria-label="Visning" className="grid grid-cols-3 gap-1 rounded-2xl bg-gray-200/70 p-1">
          {VIEWS.map((v) => (
            <Link
              key={v.id}
              href={href(v.id, date)}
              aria-current={v.id === view ? "page" : undefined}
              className={`flex h-9 items-center justify-center rounded-xl text-sm transition ${
                v.id === view ? "bg-white font-semibold shadow-sm" : "font-medium text-gray-600 hover:text-gray-900"
              }`}
            >
              {v.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href={href(view, prev)} aria-label="Forrige" className={ui.iconButton}>
            <BackIcon />
          </Link>
          <span className="flex-1 text-center text-lg font-semibold">{label}</span>
          <Link href={href(view, next)} aria-label="Neste" className={ui.iconButton}>
            <ChevronIcon />
          </Link>
        </div>
        {date !== today && (
          <Link href={href(view, today)} className="-mt-2 self-center text-sm font-medium text-accent">
            Gå til i dag
          </Link>
        )}
      </header>

      {view === "maned" && <MonthView date={date} today={today} events={events} categories={categories} />}
      {view === "uke" && <WeekView date={date} today={today} events={events} categories={categories} />}
      {view === "dag" && (
        <DayView date={date} today={today} events={events} categories={categories} nowMinutes={nowMinutes} />
      )}

      {/* Luft nederst, så pluss-knappen ikke dekker det siste innholdet. */}
      <div className="h-16" aria-hidden="true" />

      <div className="pointer-events-none fixed inset-x-0 bottom-28 z-10 mx-auto flex w-full max-w-xl justify-end px-5">
        <Link
          href={`/kalender/ny?dato=${date}`}
          aria-label="Ny hendelse"
          className="pointer-events-auto flex size-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_6px_20px_rgba(17,24,39,0.25)] transition hover:brightness-110"
        >
          <PlusIcon size={26} />
        </Link>
      </div>
    </>
  );
}
