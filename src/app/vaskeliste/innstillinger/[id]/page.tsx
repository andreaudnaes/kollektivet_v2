import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/auth";
import { getAreaSettings } from "@/lib/cleaning";
import { rotationAssignee } from "@/lib/rotation";
import { addWeeks, currentWeek, weekNumber, weekRangeLabel } from "@/lib/weeks";
import {
  addMember,
  addTask,
  deleteTask,
  moveMember,
  removeMember,
  renameArea,
  updateRotation,
} from "../../actions";
import { DeleteAreaButton, WeekOverrideSelect } from "./controls";

const OVERRIDE_WEEKS = 12;

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";
const primaryButton =
  "shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900";
const smallButton =
  "rounded-md border border-zinc-300 px-2 py-1 text-sm hover:bg-zinc-100 disabled:opacity-30 dark:border-zinc-700 dark:hover:bg-zinc-800";

export default function AreaSettingsPage({ params }: PageProps<"/vaskeliste/innstillinger/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-8">
      <Suspense fallback={<p className="text-zinc-400">Henter området …</p>}>
        <AreaSettings params={params} />
      </Suspense>
    </main>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-zinc-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

async function AreaSettings({ params }: { params: PageProps<"/vaskeliste/innstillinger/[id]">["params"] }) {
  await getCurrentUser();
  const { id } = await params;
  const week = currentWeek();
  const data = await getAreaSettings(id, week, OVERRIDE_WEEKS);
  if (!data) notFound();

  const { area, residents } = data;
  const names = new Map(residents.map((r) => [r.id, r.name]));
  const nonMembers = residents.filter((r) => !area.memberIds.includes(r.id));

  // Startuke kan velges fra 8 uker tilbake til 12 uker frem.
  const startOptions = Array.from({ length: 21 }, (_, i) => addWeeks(week, i - 8));
  if (!startOptions.includes(area.startWeek)) startOptions.unshift(area.startWeek);

  return (
    <>
      <PageHeader title={area.name} back={{ href: "/vaskeliste/innstillinger", label: "Innstillinger" }} />

      <Section title="Navn">
        <form action={renameArea.bind(null, area.id)} className="flex gap-2">
          <input name="name" required maxLength={40} defaultValue={area.name} className={inputClass} />
          <button type="submit" className={primaryButton}>
            Lagre
          </button>
        </form>
      </Section>

      <Section
        title="Rotasjon"
        description="Den første i rekkefølgen under har ansvaret i startuka."
      >
        <form action={updateRotation.bind(null, area.id)} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="space-y-1">
            <span className="text-sm font-medium">Hvor ofte bytter det?</span>
            <select name="intervalWeeks" defaultValue={area.intervalWeeks} className={inputClass}>
              <option value={1}>Hver uke</option>
              <option value={2}>Annenhver uke</option>
              <option value={3}>Hver tredje uke</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Startuke</span>
            <select name="startWeek" defaultValue={area.startWeek} className={inputClass}>
              {startOptions.map((w) => (
                <option key={w} value={w}>
                  Uke {weekNumber(w)} ({weekRangeLabel(w)}){w === week ? " – denne uka" : ""}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={primaryButton}>
            Lagre
          </button>
        </form>
      </Section>

      <Section title="Hvem er med" description="Rekkefølgen bestemmer hvem som tar over etter hvem.">
        {area.memberIds.length === 0 ? (
          <p className="text-sm text-zinc-500">Ingen er med i rotasjonen ennå.</p>
        ) : (
          <ol className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {area.memberIds.map((userId, index) => (
              <li key={userId} className="flex items-center gap-2 px-3 py-2">
                <span className="w-6 text-sm text-zinc-400">{index + 1}.</span>
                <span className="flex-1">{names.get(userId)}</span>
                <form action={moveMember.bind(null, area.id, userId, -1)}>
                  <button type="submit" disabled={index === 0} className={smallButton} aria-label="Flytt opp">
                    ↑
                  </button>
                </form>
                <form action={moveMember.bind(null, area.id, userId, 1)}>
                  <button
                    type="submit"
                    disabled={index === area.memberIds.length - 1}
                    className={smallButton}
                    aria-label="Flytt ned"
                  >
                    ↓
                  </button>
                </form>
                <form action={removeMember.bind(null, area.id, userId)}>
                  <button type="submit" className={smallButton}>
                    Fjern
                  </button>
                </form>
              </li>
            ))}
          </ol>
        )}
        {nonMembers.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-zinc-500">Legg til:</span>
            {nonMembers.map((r) => (
              <form key={r.id} action={addMember.bind(null, area.id, r.id)}>
                <button type="submit" className={smallButton}>
                  + {r.name}
                </button>
              </form>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Huskeliste"
        description="Valgfritt. Punktene vises på vaskelista og kan krysses av hver uke."
      >
        {area.tasks.length > 0 && (
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {area.tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span>{task.text}</span>
                <form action={deleteTask.bind(null, task.id)}>
                  <button type="submit" className={smallButton}>
                    Fjern
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={addTask.bind(null, area.id)} className="flex gap-2">
          <input name="text" required maxLength={80} placeholder="F.eks. Tørke benker" className={inputClass} />
          <button type="submit" className={primaryButton}>
            Legg til
          </button>
        </form>
      </Section>

      <Section
        title="Enkeltuker"
        description="Gi en uke til noen andre, eller sett «Ingen vask». Endringen gjelder bare den ene uka."
      >
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {Array.from({ length: OVERRIDE_WEEKS }, (_, i) => addWeeks(week, i)).map((w) => {
            const override = area.overrides.get(w);
            const value = override ? (override.userId ?? "skip") : "rotation";
            const rotationId = rotationAssignee(area, w);
            return (
              <li key={w} className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm">
                  <span className="font-medium">Uke {weekNumber(w)}</span>{" "}
                  <span className="text-zinc-500">
                    {weekRangeLabel(w)}
                    {w === week && " · denne uka"}
                  </span>
                </span>
                <WeekOverrideSelect
                  key={`${w}-${value}`}
                  areaId={area.id}
                  week={w}
                  value={value}
                  rotationName={rotationId ? (names.get(rotationId) ?? null) : null}
                  residents={residents}
                />
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Slett område">
        <div>
          <DeleteAreaButton areaId={area.id} name={area.name} />
        </div>
      </Section>
    </>
  );
}
