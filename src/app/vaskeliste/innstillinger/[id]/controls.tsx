"use client";

import { useState, useTransition } from "react";
import { deleteArea, setWeekOverride } from "../../actions";

export function WeekOverrideSelect({
  areaId,
  week,
  value,
  rotationName,
  residents,
}: {
  areaId: string;
  week: string;
  value: string;
  rotationName: string | null;
  residents: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(value);

  return (
    <select
      value={current}
      disabled={pending}
      aria-label="Hvem har ansvaret denne uka"
      onChange={(event) => {
        const next = event.target.value;
        setCurrent(next);
        startTransition(() => setWeekOverride(areaId, week, next));
      }}
      className={`w-full rounded-lg border px-3 py-2 text-sm disabled:opacity-60 sm:w-56 ${
        current === "rotation"
          ? "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
          : "border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950"
      }`}
    >
      <option value="rotation">Som rotasjonen ({rotationName ?? "ingen"})</option>
      {residents.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name}
        </option>
      ))}
      <option value="skip">Ingen vask denne uka</option>
    </select>
  );
}

export function DeleteAreaButton({ areaId, name }: { areaId: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
      >
        Slett {name}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-red-50 p-3 text-sm dark:bg-red-950">
      <span className="text-red-800 dark:text-red-200">
        Slette {name} med huskeliste og historikk?
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => deleteArea(areaId))}
        className="rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-500 disabled:opacity-60"
      >
        Ja, slett
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="underline">
        Avbryt
      </button>
    </div>
  );
}
