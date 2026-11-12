import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-8">
      <PageHeader title="Innstillinger" back={{ href: "/vaskeliste", label: "Vaskeliste" }} />
      <Suspense fallback={<p className="text-zinc-400">Henter områder …</p>}>
        <AreaList />
      </Suspense>
    </main>
  );
}

async function AreaList() {
  await getCurrentUser();
  const week = currentWeek();
  const [areas, residents] = await Promise.all([getAreas(week, week), listResidents()]);
  const names = new Map(residents.map((r) => [r.id, r.name]));

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-500">Ansvarsområder</h2>
        {areas.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">Ingen områder ennå. Legg til det første under.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {areas.map((area) => (
              <li key={area.id}>
                <Link
                  href={`/vaskeliste/innstillinger/${area.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <div>
                    <p className="font-medium">{area.name}</p>
                    <p className="text-sm text-zinc-500">
                      {intervalLabel[area.intervalWeeks]} ·{" "}
                      {area.memberIds.length === 0
                        ? "ingen i rotasjonen"
                        : area.memberIds.map((id) => names.get(id)).join(", ")}
                    </p>
                  </div>
                  <span className="text-zinc-400">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={createArea} className="flex gap-2">
        <input
          name="name"
          required
          maxLength={40}
          placeholder="Nytt område, f.eks. Gang"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Legg til
        </button>
      </form>
    </>
  );
}
