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
      className={`h-11 w-full rounded-xl border px-3 text-sm disabled:opacity-60 sm:w-60 ${
        current === "rotation"
          ? "border-gray-200 bg-white"
          : "border-accent bg-accent-tint font-medium"
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
        className="h-11 rounded-xl bg-white px-4 text-sm font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50"
      >
        Slett {name}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm">
      <span className="text-red-800">
        Slette {name} med huskeliste og historikk?
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => deleteArea(areaId))}
        className="h-11 rounded-xl bg-red-700 px-4 font-medium text-white hover:bg-red-500 disabled:opacity-60"
      >
        Ja, slett
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="min-h-11 underline">
        Avbryt
      </button>
    </div>
  );
}
