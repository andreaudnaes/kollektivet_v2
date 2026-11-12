"use client";

import { useOptimistic, useTransition } from "react";
import { CheckIcon } from "@/components/icons";
import { ui } from "@/components/ui";
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
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px]">
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
        className="size-[22px] shrink-0 accent-accent"
      />
      <span className={`flex-1 ${optimisticChecked ? "text-gray-500 line-through" : ""}`}>{text}</span>
      {optimisticChecked && checkedBy && <span className="text-xs text-gray-500">{checkedBy}</span>}
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
      <div className="flex items-center justify-between gap-3 rounded-[14px] bg-emerald-50 px-3.5 py-1 text-sm text-emerald-800">
        <span className="flex items-center gap-2 py-2">
          <CheckIcon size={18} />
          {doneLabel ?? "Gjort"}
        </span>
        <button
          type="button"
          onClick={() => toggle(false)}
          disabled={pending}
          className="min-h-11 underline disabled:opacity-60"
        >
          Angre
        </button>
      </div>
    );
  }

  return (
    <button type="button" onClick={() => toggle(true)} disabled={pending} className={ui.primaryButton}>
      Merk som gjort
    </button>
  );
}
