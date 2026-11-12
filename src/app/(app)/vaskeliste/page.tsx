import type { Metadata } from "next";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SlidersIcon } from "@/components/icons";
import { Page, PageHeader, Section, ui } from "@/components/ui";
import {
  assignmentForWeek,
  getAreas,
  getWeekProgress,
  listResidents,
  type AreaWithRotation,
} from "@/lib/cleaning";
import { CLIENT_STALE_SECONDS } from "@/lib/page-cache";
import type { Assignment } from "@/lib/rotation";
import { getSessionUser } from "@/lib/session";
import { addWeeks, currentWeek, weekNumber, weekRangeLabel } from "@/lib/weeks";
import { DoneButton, TaskCheckbox } from "./check-controls";

export const metadata: Metadata = { title: "Vaskeliste – Kollektivet" };

const UPCOMING_WEEKS = 6;

export default function CleaningPage() {
  return (
    <Page>
      <Suspense fallback={<p className="pt-24 text-gray-500">Henter vaskelista …</p>}>
        <CleaningOverview />
      </Suspense>
    </Page>
  );
}

/** Data for vaskelista, hentet på forhånd og husket i nettleseren en stund. */
async function loadCleaning() {
  "use cache: private";
  cacheLife({ stale: CLIENT_STALE_SECONDS });

  const me = await getSessionUser();
  if (!me) return null;
  const week = currentWeek();
  const [areas, progress, residents] = await Promise.all([
    getAreas(week, addWeeks(week, UPCOMING_WEEKS)),
    getWeekProgress(week),
    listResidents(),
  ]);
  return { me, week, areas, progress, residents };
}

async function CleaningOverview() {
  const data = await loadCleaning();
  if (!data) redirect("/logg-inn");
  const { me, week, areas, progress, residents } = data;
  const names = new Map(residents.map((r) => [r.id, r.name]));
  const nameOf = (id: string) => (id === me.id ? "deg" : (names.get(id) ?? "ukjent"));

  // Dine områder først.
  const thisWeek = areas
    .map((area) => ({ area, assignment: assignmentForWeek(area, week) }))
    .sort((a, b) => Number(isMine(b.assignment, me.id)) - Number(isMine(a.assignment, me.id)));

  return (
    <>
      <PageHeader
        title="Vaskeliste"
        subtitle={`Uke ${weekNumber(week)} · ${weekRangeLabel(week)}`}
        back={{ href: "/", label: "Tilbake til forsiden" }}
        action={
          <Link href="/vaskeliste/innstillinger" aria-label="Innstillinger for vaskelista" className={ui.iconButton}>
            <SlidersIcon />
          </Link>
        }
      />

      {areas.length === 0 ? (
        <div className={`${ui.card} flex flex-col items-center gap-3 p-6 text-center`}>
          <p className="text-gray-600">Ingen ansvarsområder ennå.</p>
          <Link href="/vaskeliste/innstillinger" className={ui.primaryButton}>
            Legg til områder
          </Link>
        </div>
      ) : (
        <>
          {thisWeek.map(({ area, assignment }) => {
            const completion = progress.completions.get(area.id);
            const mine = isMine(assignment, me.id);
            return (
              <article
                key={area.id}
                className={`${ui.card} flex flex-col gap-4 p-5 ${mine ? "ring-2 ring-accent" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold">{area.name}</h2>
                  <AssigneeLabel assignment={assignment} meId={me.id} names={names} />
                </div>

                {area.tasks.length > 0 && (
                  <ul className="flex flex-col gap-1">
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

                {assignment.kind !== "skipped" && (
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

          <Section title="Kommende uker">
            <ul className={`${ui.card} divide-y divide-gray-100`}>
              {Array.from({ length: UPCOMING_WEEKS }, (_, i) => addWeeks(week, i + 1)).map((w) => (
                <li key={w} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="flex w-24 shrink-0 flex-col">
                    <span className="text-[15px] font-semibold">Uke {weekNumber(w)}</span>
                    <span className="text-xs whitespace-nowrap text-gray-500">{weekRangeLabel(w)}</span>
                  </span>
                  <UpcomingWeek areas={areas} week={w} meId={me.id} names={names} />
                </li>
              ))}
            </ul>
          </Section>
        </>
      )}
    </>
  );
}

function isMine(assignment: Assignment, meId: string) {
  return assignment.kind === "user" && assignment.userId === meId;
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
    <ul className="flex flex-1 flex-col gap-0.5 text-sm">
      {areas.map((area) => {
        const assignment = assignmentForWeek(area, week);
        return (
          <li key={area.id}>
            {area.name} ·{" "}
            {assignment.kind === "user" ? (
              <strong className={`font-semibold ${assignment.userId === meId ? "text-accent" : ""}`}>
                {assignment.userId === meId ? "Du" : (names.get(assignment.userId) ?? "Ukjent")}
                {assignment.overridden && " *"}
              </strong>
            ) : (
              <span className="text-gray-500">
                {assignment.kind === "skipped" ? "Ingen vask" : "Ingen i rotasjonen"}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function AssigneeLabel({
  assignment,
  meId,
  names,
}: {
  assignment: Assignment;
  meId: string;
  names: Map<string, string>;
}) {
  if (assignment.kind === "skipped") {
    return <span className="text-sm text-gray-500">Ingen vask denne uka</span>;
  }
  if (assignment.kind === "none") {
    return <span className="text-sm text-gray-500">Ingen i rotasjonen</span>;
  }
  const isMe = assignment.userId === meId;
  return (
    <span
      className={
        isMe
          ? "rounded-full bg-accent-tint px-3 py-1 text-[13px] font-semibold text-accent"
          : "text-sm font-medium text-gray-600"
      }
      title={assignment.overridden ? "Endret for denne uka" : undefined}
    >
      {isMe ? "Du" : (names.get(assignment.userId) ?? "Ukjent")}
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
