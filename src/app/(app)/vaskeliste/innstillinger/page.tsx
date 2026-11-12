import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronIcon } from "@/components/icons";
import { Page, PageHeader, Section, ui } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getAreas, listResidents } from "@/lib/cleaning";
import { currentWeek } from "@/lib/weeks";
import { createArea } from "../actions";

export const metadata: Metadata = { title: "Innstillinger for vaskelista – Kollektivet" };

const intervalLabel: Record<number, string> = {
  1: "Bytter hver uke",
  2: "Bytter annenhver uke",
  3: "Bytter hver tredje uke",
};

export default function CleaningSettingsPage() {
  return (
    <Page>
      <PageHeader
        title="Innstillinger"
        subtitle="Vaskeliste"
        back={{ href: "/vaskeliste", label: "Tilbake til vaskelista" }}
      />
      <Suspense fallback={<p className="text-gray-500">Henter områder …</p>}>
        <AreaList />
      </Suspense>
    </Page>
  );
}

async function AreaList() {
  // Hentes ved hvert besøk (ikke på forhånd), siden siden brukes sjelden.
  await connection();
  await getCurrentUser();
  const week = currentWeek();
  const [areas, residents] = await Promise.all([getAreas(week, week), listResidents()]);
  const names = new Map(residents.map((r) => [r.id, r.name]));

  return (
    <>
      <Section title="Ansvarsområder">
        {areas.length === 0 ? (
          <p className="text-gray-600">Ingen områder ennå. Legg til det første under.</p>
        ) : (
          <ul className={`${ui.card} divide-y divide-gray-100 overflow-hidden`}>
            {areas.map((area) => (
              <li key={area.id}>
                <Link
                  href={`/vaskeliste/innstillinger/${area.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-gray-50"
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="font-semibold">{area.name}</span>
                    <span className="text-sm text-gray-600">
                      {intervalLabel[area.intervalWeeks]} ·{" "}
                      {area.memberIds.length === 0
                        ? "ingen i rotasjonen"
                        : area.memberIds.map((id) => names.get(id)).join(", ")}
                    </span>
                  </span>
                  <ChevronIcon className="shrink-0 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <form action={createArea} className="flex gap-2">
        <label className="sr-only" htmlFor="new-area">
          Nytt område
        </label>
        <input
          id="new-area"
          name="name"
          required
          maxLength={40}
          placeholder="Nytt område, f.eks. Gang"
          className={ui.input}
        />
        <button type="submit" className={`${ui.primaryButton} shrink-0`}>
          Legg til
        </button>
      </form>
    </>
  );
}
