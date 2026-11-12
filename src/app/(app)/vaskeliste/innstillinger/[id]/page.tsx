import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/icons";
import { Page, PageHeader, Section, ui } from "@/components/ui";
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

const card = `${ui.card} divide-y divide-gray-100 overflow-hidden`;

export default function AreaSettingsPage({ params }: PageProps<"/vaskeliste/innstillinger/[id]">) {
  return (
    <Page>
      <Suspense fallback={<p className="pt-24 text-gray-500">Henter området …</p>}>
        <AreaSettings params={params} />
      </Suspense>
    </Page>
  );
}

async function AreaSettings({ params }: { params: PageProps<"/vaskeliste/innstillinger/[id]">["params"] }) {
  // Hentes ved hvert besøk (ikke på forhånd), siden siden brukes sjelden.
  await connection();
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
      <PageHeader
        title={area.name}
        subtitle="Innstillinger for området"
        back={{ href: "/vaskeliste/innstillinger", label: "Tilbake til innstillinger" }}
      />

      <Section title="Navn">
        <form action={renameArea.bind(null, area.id)} className="flex gap-2">
          <input name="name" required maxLength={40} defaultValue={area.name} className={ui.input} />
          <button type="submit" className={`${ui.primaryButton} shrink-0`}>
            Lagre
          </button>
        </form>
      </Section>

      <Section
        title="Rotasjon"
        description="Den første i rekkefølgen under har ansvaret i startuka."
      >
        <form action={updateRotation.bind(null, area.id)} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">Hvor ofte bytter det?</span>
            <select name="intervalWeeks" defaultValue={area.intervalWeeks} className={ui.input}>
              <option value={1}>Hver uke</option>
              <option value={2}>Annenhver uke</option>
              <option value={3}>Hver tredje uke</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">Startuke</span>
            <select name="startWeek" defaultValue={area.startWeek} className={ui.input}>
              {startOptions.map((w) => (
                <option key={w} value={w}>
                  Uke {weekNumber(w)} ({weekRangeLabel(w)}){w === week ? " – denne uka" : ""}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={`${ui.primaryButton} shrink-0`}>
            Lagre
          </button>
        </form>
      </Section>

      <Section title="Hvem er med" description="Rekkefølgen bestemmer hvem som tar over etter hvem.">
        {area.memberIds.length === 0 ? (
          <p className="text-sm text-gray-500">Ingen er med i rotasjonen ennå.</p>
        ) : (
          <ol className={card}>
            {area.memberIds.map((userId, index) => (
              <li key={userId} className="flex items-center gap-2 px-4 py-3">
                <span className="w-6 text-sm text-gray-400">{index + 1}.</span>
                <span className="flex-1 font-medium">{names.get(userId)}</span>
                <form action={moveMember.bind(null, area.id, userId, -1)}>
                  <button type="submit" disabled={index === 0} className={ui.smallButton} aria-label="Flytt opp">
                    <ArrowUpIcon size={16} />
                  </button>
                </form>
                <form action={moveMember.bind(null, area.id, userId, 1)}>
                  <button
                    type="submit"
                    disabled={index === area.memberIds.length - 1}
                    className={ui.smallButton}
                    aria-label="Flytt ned"
                  >
                    <ArrowDownIcon size={16} />
                  </button>
                </form>
                <form action={removeMember.bind(null, area.id, userId)}>
                  <button type="submit" className={ui.smallButton}>
                    Fjern
                  </button>
                </form>
              </li>
            ))}
          </ol>
        )}
        {nonMembers.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-500">Legg til:</span>
            {nonMembers.map((r) => (
              <form key={r.id} action={addMember.bind(null, area.id, r.id)}>
                <button type="submit" className={ui.smallButton}>
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
          <ul className={card}>
            {area.tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span>{task.text}</span>
                <form action={deleteTask.bind(null, task.id)}>
                  <button type="submit" className={ui.smallButton}>
                    Fjern
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={addTask.bind(null, area.id)} className="flex gap-2">
          <input name="text" required maxLength={80} placeholder="F.eks. Tørke benker" className={ui.input} />
          <button type="submit" className={`${ui.primaryButton} shrink-0`}>
            Legg til
          </button>
        </form>
      </Section>

      <Section
        title="Enkeltuker"
        description="Gi en uke til noen andre, eller sett «Ingen vask». Endringen gjelder bare den ene uka."
      >
        <ul className={card}>
          {Array.from({ length: OVERRIDE_WEEKS }, (_, i) => addWeeks(week, i)).map((w) => {
            const override = area.overrides.get(w);
            const value = override ? (override.userId ?? "skip") : "rotation";
            const rotationId = rotationAssignee(area, w);
            return (
              <li key={w} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm">
                  <span className="font-medium">Uke {weekNumber(w)}</span>{" "}
                  <span className="text-gray-500">
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
