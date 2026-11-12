import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import {
  assignmentForWeek,
  getAreas,
  getWeekProgress,
  listResidents,
  type AreaWithRotation,
} from "@/lib/cleaning";
import type { Assignment } from "@/lib/rotation";
import { addWeeks, currentWeek, weekNumber, weekRangeLabel } from "@/lib/weeks";
import { PageHeader } from "@/components/page-header";
import { DoneButton, TaskCheckbox } from "./check-controls";

export const metadata: Metadata = { title: "Vaskeliste – Kollektivet" };

const UPCOMING_WEEKS = 6;

export default function CleaningPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-8">
      <PageHeader
        title="Vaskeliste"
        back={{ href: "/", label: "Forsiden" }}
        action={{ href: "/vaskeliste/innstillinger", label: "Innstillinger" }}
      />
      <Suspense fallback={<p className="text-zinc-400">Henter vaskelista …</p>}>
        <CleaningOverview />
      </Suspense>
    </main>
  );
}

async function CleaningOverview() {
  const me = await getCurrentUser();
  const week = currentWeek();
  const lastWeek = addWeeks(week, UPCOMING_WEEKS);

  const [areas, progress, residents] = await Promise.all([
    getAreas(week, lastWeek),
    getWeekProgress(week),
    listResidents(),
  ]);
  const names = new Map(residents.map((r) => [r.id, r.name]));
  const nameOf = (id: string) => (id === me.id ? "deg" : (names.get(id) ?? "ukjent"));

  if (areas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
        <p className="text-zinc-600 dark:text-zinc-400">Ingen ansvarsområder ennå.</p>
        <Link
          href="/vaskeliste/innstillinger"
          className="mt-3 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Legg til områder
        </Link>
      </div>
    );
  }

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-500">
          Denne uka · Uke {weekNumber(week)} · {weekRangeLabel(week)}
        </h2>
        {areas.map((area) => {
          const completion = progress.completions.get(area.id);
          return (
            <article
              key={area.id}
              className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold">{area.name}</h3>
                <AssigneeLabel assignment={assignmentForWeek(area, week)} meId={me.id} names={names} />
              </div>

              {area.tasks.length > 0 && (
                <ul>
                  {area.tasks.map((task) => {
                    const check = progress.checks.get(task.id);
                    return (
                      <li key={task.id}>
                        <TaskCheckbox
                          taskId={task.id}
                          week={week}
                          text={task.text}
                          checked={Boolean(check)}
                          checkedBy={check ? nameOf(check.userId) : undefined}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}

              {assignmentForWeek(area, week).kind !== "skipped" && (
                <DoneButton
                  areaId={area.id}
                  week={week}
                  done={Boolean(completion)}
                  doneLabel={
                    completion
                      ? `Gjort av ${nameOf(completion.userId)} ${formatTime(completion.completedAt)}`
                      : undefined
                  }
                />
              )}
            </article>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-500">Kommende uker</h2>
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {Array.from({ length: UPCOMING_WEEKS }, (_, i) => addWeeks(week, i + 1)).map((w) => (
            <li key={w} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4">
              <div className="shrink-0 whitespace-nowrap text-sm sm:w-44">
                <span className="font-medium">Uke {weekNumber(w)}</span>{" "}
                <span className="text-zinc-500">{weekRangeLabel(w)}</span>
              </div>
              <UpcomingWeek areas={areas} week={w} meId={me.id} names={names} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function UpcomingWeek({
  areas,
  week,
  meId,
  names,
}: {
  areas: AreaWithRotation[];
  week: string;
  meId: string;
  names: Map<string, string>;
}) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {areas.map((area) => (
        <li key={area.id}>
          <span className="text-zinc-500">{area.name}:</span>{" "}
          <AssigneeLabel assignment={assignmentForWeek(area, week)} meId={meId} names={names} compact />
        </li>
      ))}
    </ul>
  );
}

function AssigneeLabel({
  assignment,
  meId,
  names,
  compact = false,
}: {
  assignment: Assignment;
  meId: string;
  names: Map<string, string>;
  compact?: boolean;
}) {
  if (assignment.kind === "skipped") {
    return <span className="text-sm text-zinc-400">Ingen vask</span>;
  }
  if (assignment.kind === "none") {
    return <span className="text-sm text-zinc-400">Ingen i rotasjonen</span>;
  }
  const isMe = assignment.userId === meId;
  const name = names.get(assignment.userId) ?? "Ukjent";
  return (
    <span
      className={
        isMe
          ? "rounded-full bg-amber-100 px-2 py-0.5 text-sm font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
          : compact
            ? undefined
            : "text-sm text-zinc-600 dark:text-zinc-400"
      }
      title={assignment.overridden ? "Endret for denne uka" : undefined}
    >
      {isMe ? "Du" : name}
      {assignment.overridden && " *"}
    </span>
  );
}

function formatTime(date: Date) {
  return date.toLocaleString("nb-NO", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Oslo",
  });
}
