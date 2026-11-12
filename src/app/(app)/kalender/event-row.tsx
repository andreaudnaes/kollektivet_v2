import Link from "next/link";
import { ChevronIcon } from "@/components/icons";
import { colorsFor, type CalendarCategory, type CalendarEvent } from "@/lib/calendar";
import { timeLabelForDay } from "@/lib/dates";

/** Én hendelse i en liste, med fargeprikk, tittel, tid og kategori. */
export function EventRow({
  event,
  day,
  categories,
}: {
  event: CalendarEvent;
  day: string;
  categories: Map<string, CalendarCategory>;
}) {
  const colors = colorsFor(event, categories);
  return (
    <li>
      <Link
        href={`/kalender/${event.id}`}
        className="flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50"
      >
        <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: colors.hex }} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold">{event.title}</span>
          <span className="text-sm text-gray-600">
            {timeLabelForDay(event, day)}
            {colors.categoryName && ` · ${colors.categoryName}`}
          </span>
        </span>
        <ChevronIcon size={18} className="shrink-0 text-gray-400" />
      </Link>
    </li>
  );
}
