"use client";

import { useActionState, useState, useTransition } from "react";
import { ui } from "@/components/ui";
import { categoryColor } from "@/lib/calendar-colors";
import type { EventFormState } from "./actions";

export type EventFormValues = {
  title: string;
  description: string;
  categoryId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
};

export function EventForm({
  action,
  initial,
  categories,
  submitLabel,
  onDelete,
}: {
  action: (state: EventFormState, formData: FormData) => Promise<EventFormState>;
  initial: EventFormValues;
  categories: { id: string; name: string; color: string }[];
  submitLabel: string;
  onDelete?: () => Promise<void>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [allDay, setAllDay] = useState(initial.allDay);
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-700">Tittel</span>
        <input
          name="title"
          required
          maxLength={80}
          defaultValue={initial.title}
          placeholder="F.eks. Julebord"
          className={ui.input}
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium text-gray-700">Kategori</legend>
        <div className="flex flex-wrap gap-2">
          <CategoryChip id="" name="Ingen" color="gra" defaultChecked={!initial.categoryId} />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              id={c.id}
              name={c.name}
              color={c.color}
              defaultChecked={initial.categoryId === c.id}
            />
          ))}
        </div>
      </fieldset>

      <div className={`${ui.card} flex flex-col gap-4 p-4`}>
        <label className="flex min-h-11 items-center justify-between gap-3">
          <span className="font-medium">Hele dagen</span>
          <input
            type="checkbox"
            name="allDay"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="size-[22px] accent-accent"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Starter</span>
            <input
              type="date"
              name="startDate"
              required
              value={startDate}
              onChange={(e) => {
                const value = e.target.value;
                setStartDate(value);
                // Flytt sluttdatoen med hvis den havner før start.
                if (!endDate || endDate < value) setEndDate(value);
              }}
              className={`${ui.input} h-11 min-w-0 bg-gray-50 px-3`}
            />
          </label>
          {!allDay && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">Kl.</span>
              <input
                type="time"
                name="startTime"
                required
                defaultValue={initial.startTime}
                className={`${ui.input} h-11 min-w-0 bg-gray-50 px-3`}
              />
            </label>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Slutter</span>
            <input
              type="date"
              name="endDate"
              min={startDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`${ui.input} h-11 min-w-0 bg-gray-50 px-3`}
            />
          </label>
          {!allDay && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600">Kl. (valgfritt)</span>
              <input
                type="time"
                name="endTime"
                defaultValue={initial.endTime}
                className={`${ui.input} h-11 min-w-0 bg-gray-50 px-3`}
              />
            </label>
          )}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-700">Beskrivelse (valgfritt)</span>
        <textarea
          name="description"
          maxLength={500}
          rows={3}
          defaultValue={initial.description}
          placeholder="Hvem, hva, hvor …"
          className={`${ui.input} h-auto py-3`}
        />
      </label>

      {state?.error && (
        <p role="alert" className="rounded-[14px] bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={`${ui.primaryButton} w-full`}>
        {pending ? "Lagrer …" : submitLabel}
      </button>

      {onDelete && <DeleteButton onDelete={onDelete} />}
    </form>
  );
}

function CategoryChip({
  id,
  name,
  color,
  defaultChecked,
}: {
  id: string;
  name: string;
  color: string;
  defaultChecked: boolean;
}) {
  const c = categoryColor(color);
  return (
    <label className="cursor-pointer">
      <input type="radio" name="categoryId" value={id} defaultChecked={defaultChecked} className="peer sr-only" />
      <span
        className="flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-medium ring-1 ring-gray-200 transition peer-checked:ring-2 peer-checked:ring-gray-900 peer-focus-visible:ring-2 peer-focus-visible:ring-accent"
        style={{ background: c.bg, color: c.text }}
      >
        <span className="size-2.5 rounded-full" style={{ background: c.hex }} />
        {name}
      </span>
    </label>
  );
}

function DeleteButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="h-11 rounded-xl bg-white text-sm font-medium text-red-700 ring-1 ring-red-200 transition hover:bg-red-50"
      >
        Slett hendelsen
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm">
      <span className="flex-1 text-red-800">Slette hendelsen for alle?</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => onDelete())}
        className="h-11 rounded-xl bg-red-700 px-4 font-medium text-white disabled:opacity-60"
      >
        Ja, slett
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="min-h-11 underline">
        Avbryt
      </button>
    </div>
  );
}
