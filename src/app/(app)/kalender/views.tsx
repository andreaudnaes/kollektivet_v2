import Link from "next/link";
import { ui } from "@/components/ui";
import { colorsFor, eventsOnDay, type CalendarCategory, type CalendarEvent } from "@/lib/calendar";
import {
  WEEKDAY_LETTERS,
  WEEKDAYS_SHORT,
  capitalize,
  dayOfMonth,
  isAllDayOn,
  longDateLabel,
  minutesOnDay,
  monthGrid,
  sameMonth,
  timeLabelForDay,
  weekDays,
} from "@/lib/dates";
import { EventRow } from "./event-row";

type ViewProps = {
  date: string;
  today: string;
  events: CalendarEvent[];
  categories: Map<string, CalendarCategory>;
};

const dayHref = (date: string) => `/kalender?visning=dag&dato=${date}`;

// --- Måned ---------------------------------------------------------------------

export function MonthView({ date, today, events, categories }: ViewProps) {
  const grid = monthGrid(date);
  const selected = eventsOnDay(events, date);

  return (
    <>
      <div className={`${ui.card} overflow-hidden p-2`}>
        <div className="grid grid-cols-7 pb-1">
          {WEEKDAY_LETTERS.map((letter, i) => (
            <span key={i} className="py-1 text-center text-xs font-semibold text-gray-500">
              {letter}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px">
          {grid.flat().map((day) => {
            const dayEvents = eventsOnDay(events, day);
            const inMonth = sameMonth(day, date);
            const isToday = day === today;
            const isSelected = day === date;
            return (
              <Link
                key={day}
                href={`/kalender?visning=maned&dato=${day}`}
                aria-label={`${longDateLabel(day)}${dayEvents.length ? `, ${dayEvents.length} hendelser` : ""}`}
                aria-current={isSelected ? "date" : undefined}
                className={`flex min-h-[72px] flex-col gap-0.5 rounded-lg p-1 transition hover:bg-gray-50 ${
                  isSelected ? "bg-accent-tint" : ""
                }`}
              >
                <span
                  className={`flex size-6 items-center justify-center self-center rounded-full text-[13px] ${
                    isToday
                      ? "bg-accent font-bold text-white"
                      : inMonth
                        ? "font-medium text-gray-900"
                        : "text-gray-400"
                  }`}
                >
                  {dayOfMonth(day)}
                </span>
                {dayEvents.slice(0, 2).map((event) => {
                  const colors = colorsFor(event, categories);
                  return (
                    <span
                      key={event.id}
                      className="truncate rounded px-1 text-[10px] leading-4 font-medium"
                      style={{ background: colors.bg, color: colors.text }}
                    >
                      {event.title}
                    </span>
                  );
                })}
                {dayEvents.length > 2 && (
                  <span className="px-1 text-[10px] leading-4 text-gray-500">+{dayEvents.length - 2}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className={ui.sectionLabel}>{capitalize(longDateLabel(date))}</h2>
        <DayList day={date} events={selected} categories={categories} />
      </section>
    </>
  );
}

// --- Uke -----------------------------------------------------------------------

export function WeekView({ date, today, events, categories }: ViewProps) {
  return (
    <ul className={`${ui.card} divide-y divide-gray-100 overflow-hidden`}>
      {weekDays(date).map((day, i) => {
        const dayEvents = eventsOnDay(events, day);
        const isToday = day === today;
        return (
          <li key={day} className="flex gap-3 px-4 py-3">
            <Link
              href={dayHref(day)}
              aria-label={`Vis ${longDateLabel(day)}`}
              className="flex w-11 shrink-0 flex-col items-center rounded-xl py-1 transition hover:bg-gray-50"
            >
              <span className="text-xs font-medium text-gray-500">{WEEKDAYS_SHORT[i]}</span>
              <span
                className={`flex size-8 items-center justify-center rounded-full text-base font-semibold ${
                  isToday ? "bg-accent text-white" : ""
                }`}
              >
                {dayOfMonth(day)}
              </span>
            </Link>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
              {dayEvents.length === 0 ? (
                <span className="text-sm text-gray-400">Ingenting planlagt</span>
              ) : (
                dayEvents.map((event) => {
                  const colors = colorsFor(event, categories);
                  return (
                    <Link
                      key={event.id}
                      href={`/kalender/${event.id}`}
                      className="flex flex-col rounded-xl px-3 py-2 transition hover:brightness-95"
                      style={{ background: colors.bg, color: colors.text }}
                    >
                      <span className="truncate text-sm font-semibold">{event.title}</span>
                      <span className="text-xs opacity-90">{timeLabelForDay(event, day)}</span>
                    </Link>
                  );
                })
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// --- Dag -----------------------------------------------------------------------

const HOUR_HEIGHT = 56;

export function DayView({ date, today, events, categories, nowMinutes }: ViewProps & { nowMinutes: number }) {
  const dayEvents = eventsOnDay(events, date);
  const allDay = dayEvents.filter((e) => isAllDayOn(e, date));
  const timed = dayEvents.filter((e) => !isAllDayOn(e, date));

  const positioned = layoutColumns(timed.map((event) => ({ event, ...minutesOnDay(event, date) })));
  const earliest = Math.min(7 * 60, ...positioned.map((p) => p.start));
  const firstHour = Math.floor(earliest / 60);
  const hours = Array.from({ length: 24 - firstHour }, (_, i) => firstHour + i);
  const top = (minutes: number) => ((minutes - firstHour * 60) / 60) * HOUR_HEIGHT;

  return (
    <>
      {allDay.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className={ui.sectionLabel}>Hele dagen</h2>
          <DayList day={date} events={allDay} categories={categories} />
        </section>
      )}

      <div className={`${ui.card} relative overflow-hidden py-3 pr-3`}>
        <div className="relative" style={{ height: hours.length * HOUR_HEIGHT }}>
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute inset-x-0 flex items-start"
              style={{ top: top(hour * 60) }}
            >
              <span className="w-14 shrink-0 -translate-y-2 pr-2 text-right text-xs text-gray-500">
                {String(hour).padStart(2, "0")}:00
              </span>
              <span className="mt-0 h-px flex-1 bg-gray-100" />
            </div>
          ))}

          {date === today && nowMinutes >= firstHour * 60 && (
            <div className="absolute right-0 left-12 z-10 flex items-center" style={{ top: top(nowMinutes) }} aria-hidden="true">
              <span className="size-2.5 rounded-full bg-red-500" />
              <span className="h-0.5 flex-1 bg-red-500" />
            </div>
          )}

          <div className="absolute inset-y-0 right-0 left-14">
            {positioned.map(({ event, start, end, column, columns }) => {
              const colors = colorsFor(event, categories);
              const height = Math.max(((end - start) / 60) * HOUR_HEIGHT - 2, 24);
              return (
                <Link
                  key={event.id}
                  href={`/kalender/${event.id}`}
                  className="absolute flex flex-col overflow-hidden rounded-lg px-2 py-1 text-xs transition hover:brightness-95"
                  style={{
                    top: top(start) + 1,
                    height,
                    left: `calc(${(column / columns) * 100}% + 2px)`,
                    width: `calc(${100 / columns}% - 4px)`,
                    background: colors.bg,
                    color: colors.text,
                    boxShadow: `inset 3px 0 0 ${colors.hex}`,
                  }}
                >
                  <span className="truncate font-semibold">{event.title}</span>
                  {height > 36 && <span className="truncate opacity-90">{timeLabelForDay(event, date)}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

/** Legger overlappende hendelser side om side. */
function layoutColumns<T extends { start: number; end: number }>(items: T[]) {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const result: (T & { column: number; columns: number })[] = [];
  let cluster: (T & { column: number; columns: number })[] = [];
  let clusterEnd = -1;
  let columnEnds: number[] = [];

  const closeCluster = () => {
    const columns = Math.max(1, columnEnds.length);
    for (const item of cluster) item.columns = columns;
    result.push(...cluster);
    cluster = [];
    columnEnds = [];
  };

  for (const item of sorted) {
    if (item.start >= clusterEnd && cluster.length > 0) closeCluster();
    let column = columnEnds.findIndex((end) => end <= item.start);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(item.end);
    } else {
      columnEnds[column] = item.end;
    }
    cluster.push({ ...item, column, columns: 1 });
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  closeCluster();
  return result;
}

// --- Felles --------------------------------------------------------------------

function DayList({
  day,
  events,
  categories,
}: {
  day: string;
  events: CalendarEvent[];
  categories: Map<string, CalendarCategory>;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-600">Ingenting planlagt.</p>;
  }
  return (
    <ul className={`${ui.card} divide-y divide-gray-100 overflow-hidden`}>
      {events.map((event) => (
        <EventRow key={event.id} event={event} day={day} categories={categories} />
      ))}
    </ul>
  );
}
