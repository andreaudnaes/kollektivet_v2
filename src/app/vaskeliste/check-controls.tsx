"use client";

import { useOptimistic, useTransition } from "react";
import { setAreaDone, setTaskChecked } from "./actions";

export function TaskCheckbox({
  taskId,
  week,
  text,
  checked,
  checkedBy,
}: {
  taskId: string;
  week: string;
  text: string;
  checked: boolean;
  checkedBy?: string;
}) {
  const [optimisticChecked, setOptimisticChecked] = useOptimistic(checked);
  const [, startTransition] = useTransition();

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg px-1 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900">
      <input
        type="checkbox"
        checked={optimisticChecked}
        onChange={(event) => {
          const next = event.target.checked;
          startTransition(async () => {
            setOptimisticChecked(next);
            await setTaskChecked(taskId, week, next);
          });
        }}
        className="mt-0.5 size-5 shrink-0 accent-emerald-600"
      />
      <span className="flex-1">
        <span className={optimisticChecked ? "text-zinc-400 line-through" : undefined}>{text}</span>
        {optimisticChecked && checkedBy && (
          <span className="ml-2 text-xs text-zinc-400">{checkedBy}</span>
        )}
      </span>
    </label>
  );
}

export function DoneButton({
  areaId,
  week,
  done,
  doneLabel,
}: {
  areaId: string;
  week: string;
  done: boolean;
  doneLabel?: string;
}) {
  const [optimisticDone, setOptimisticDone] = useOptimistic(done);
  const [pending, startTransition] = useTransition();

  const toggle = (next: boolean) =>
    startTransition(async () => {
      setOptimisticDone(next);
      await setAreaDone(areaId, week, next);
    });

  if (optimisticDone) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
        <span>✓ {doneLabel ?? "Gjort"}</span>
        <button
          type="button"
          onClick={() => toggle(false)}
          disabled={pending}
          className="text-emerald-700 underline disabled:opacity-60 dark:text-emerald-300"
        >
          Angre
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(true)}
      disabled={pending}
      className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
    >
      Merk som gjort
    </button>
  );
}
