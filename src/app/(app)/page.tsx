import Link from "next/link";
import { cacheLife } from "next/cache";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BoxIcon, CalendarIcon, CartIcon, CleaningIcon, UserIcon } from "@/components/icons";
import { Page, ui } from "@/components/ui";
import { assignmentForWeek, getAreas, getWeekProgress } from "@/lib/cleaning";
import { getUpcomingEvents } from "@/lib/calendar";
import { shortDateLabel } from "@/lib/dates";
import { CLIENT_STALE_SECONDS } from "@/lib/page-cache";
import { getSessionUser } from "@/lib/session";
import { countOpenItems } from "@/lib/shopping";
import { currentWeek, todayInOslo, weekNumber } from "@/lib/weeks";

export default function Home() {
  return (
    <Page>
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </Page>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <div className="h-16 w-48 rounded-xl bg-gray-200/60" />
      <div className="h-44 rounded-[20px] bg-gray-200/60" />
    </div>
  );
}

function todayLabel() {
  const label = new Date().toLocaleDateString("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Oslo",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Alt forsiden trenger. «use cache: private» gjør at resultatet kan hentes på
 * forhånd og huskes i nettleseren til denne brukeren en stund, så forsiden
 * åpnes med en gang. Det tømmes når noen endrer noe i appen.
 */
async function loadHome() {
  "use cache: private";
  cacheLife({ stale: CLIENT_STALE_SECONDS });

  const me = await getSessionUser();
  if (!me) return null;
  const week = currentWeek();
  const today = todayInOslo();
  const [areas, progress, openItems, upcoming] = await Promise.all([
    getAreas(week, week),
    getWeekProgress(week),
    countOpenItems(),
    getUpcomingEvents(today, 1),
  ]);
  return { me, week, today, dateLabel: todayLabel(), areas, progress, openItems, nextEvent: upcoming[0] };
}

async function HomeContent() {
  const data = await loadHome();
  if (!data) redirect("/logg-inn");
  const { me, week, today, dateLabel, areas, progress, openItems, nextEvent } = data;

  const active = areas
    .map((area) => ({ area, assignment: assignmentForWeek(area, week) }))
    .filter(({ assignment }) => assignment.kind === "user");
  const doneCount = active.filter(({ area }) => progress.completions.has(area.id)).length;
  const mine = active.filter(
    ({ assignment }) => assignment.kind === "user" && assignment.userId === me.id,
  );

  return (
    <>
      <header className="flex items-start justify-between pb-1">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-gray-600">{dateLabel}</p>
          <h1 className="text-[30px] font-bold tracking-[-0.02em]">Hei, {me.name}</h1>
        </div>
        <Link href="/profil" aria-label="Profil og innstillinger" className={ui.iconButton}>
          <UserIcon />
        </Link>
      </header>

      {mine.length === 0 ? (
        <Link
          href="/vaskeliste"
          className={`${ui.card} flex flex-col gap-1 p-5 transition hover:bg-gray-50`}
        >
          <span className="text-[13px] font-medium text-gray-600">Uke {weekNumber(week)}</span>
          <span className="text-xl font-bold tracking-[-0.01em]">Ingen vaskeoppgaver denne uka</span>
          <span className="text-sm text-gray-600">Se hvem som har hva på vaskelista.</span>
        </Link>
      ) : (
        mine.map(({ area }) => {
          const done = progress.completions.has(area.id);
          const checked = area.tasks.filter((t) => progress.checks.has(t.id)).length;
          const total = area.tasks.length;
          const percent = done ? 100 : total > 0 ? Math.round((checked / total) * 100) : 0;
          const status = done ? "Gjort" : total > 0 ? `${checked} av ${total} gjort` : "Ikke gjort ennå";
          return (
            <Link
              key={area.id}
              href="/vaskeliste"
              className="flex flex-col gap-4 rounded-[20px] bg-accent p-5 text-white transition hover:brightness-110"
            >
              <span className="flex items-center justify-between">
                <span className="text-[13px] font-medium opacity-90">
                  Din oppgave · Uke {weekNumber(week)}
                </span>
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
                  {status}
                </span>
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-[26px] font-bold tracking-[-0.02em]">{area.name}</span>
                {total > 0 && (
                  <span className="text-sm opacity-90">{area.tasks.map((t) => t.text).join(" · ")}</span>
                )}
              </span>
              <span className="h-1.5 overflow-hidden rounded-full bg-white/25">
                <span className="block h-1.5 rounded-full bg-white" style={{ width: `${percent}%` }} />
              </span>
            </Link>
          );
        })
      )}

      <section className="flex flex-col gap-3">
        <h2 className={ui.sectionLabel}>Kollektivet</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/vaskeliste"
            prefetch
            className={`${ui.card} flex flex-col gap-7 rounded-2xl p-4 transition hover:bg-gray-50`}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent-tint text-accent">
              <CleaningIcon />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-semibold">Vaskeliste</span>
              <span className="text-[13px] text-gray-600">
                {active.length === 0 ? "Ingen områder ennå" : `${doneCount} av ${active.length} gjort`}
              </span>
            </span>
          </Link>
          <Link
            href="/handleliste"
            prefetch
            className={`${ui.card} flex flex-col gap-7 rounded-2xl p-4 transition hover:bg-gray-50`}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent-tint text-accent">
              <CartIcon />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-semibold">Handleliste</span>
              <span className="text-[13px] text-gray-600">
                {openItems === 0 ? "Ingenting å kjøpe" : `${openItems} ${openItems === 1 ? "vare" : "varer"} å kjøpe`}
              </span>
            </span>
          </Link>
          <Link
            href="/kalender"
            prefetch
            className={`${ui.card} flex flex-col gap-7 rounded-2xl p-4 transition hover:bg-gray-50`}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent-tint text-accent">
              <CalendarIcon />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-semibold">Kalender</span>
              <span className="truncate text-[13px] text-gray-600">
                {nextEvent
                  ? `${nextEvent.title} · ${nextEvent.startDate <= today ? "i dag" : shortDateLabel(nextEvent.startDate)}`
                  : "Ingen planer ennå"}
              </span>
            </span>
          </Link>
          <ComingSoon title="Beholdning" Icon={BoxIcon} />
        </div>
      </section>
    </>
  );
}

function ComingSoon({ title, Icon }: { title: string; Icon: typeof CartIcon }) {
  return (
    <div className={`${ui.card} flex flex-col gap-7 rounded-2xl p-4`}>
      <span className="flex size-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
        <Icon />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="font-semibold">{title}</span>
        <span className="text-[13px] text-gray-600">Kommer snart</span>
      </span>
    </div>
  );
}
