"use client";

import { useActionState, useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { PlusIcon, XIcon } from "@/components/icons";
import { ui } from "@/components/ui";
import { addItem, deleteItem, setBought } from "./actions";

export function AddItemForm({ suggestions }: { suggestions: string[] }) {
  const [state, formAction, pending] = useActionState(addItem, undefined);
  const [showDetails, setShowDetails] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Tøm skjemaet og sett fokus tilbake etter at en vare er lagt til.
  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      nameRef.current?.focus();
    }
  }, [state?.ok]);

  return (
    <form ref={formRef} action={formAction} className={`${ui.card} flex flex-col gap-3 p-4`}>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="item-name">
          Vare
        </label>
        <input
          ref={nameRef}
          id="item-name"
          name="name"
          required
          maxLength={60}
          list="item-suggestions"
          autoComplete="off"
          autoCapitalize="sentences"
          placeholder="Hva trenger dere?"
          className={`${ui.input} bg-gray-50`}
        />
        <datalist id="item-suggestions">
          {suggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <button
          type="submit"
          disabled={pending}
          aria-label="Legg til på lista"
          className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-accent text-white transition hover:brightness-110 disabled:opacity-60"
        >
          <PlusIcon size={22} />
        </button>
      </div>

      {showDetails ? (
        <div className="flex gap-2">
          <label className="flex w-28 shrink-0 flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Antall</span>
            <input name="quantity" maxLength={30} placeholder="2 stk" className={`${ui.input} h-11 bg-gray-50`} />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Kommentar</span>
            <input name="note" maxLength={80} placeholder="Den laktosefrie" className={`${ui.input} h-11 bg-gray-50`} />
          </label>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowDetails(true)}
          className="self-start text-sm font-medium text-accent"
        >
          + Antall eller kommentar
        </button>
      )}

      {state?.error && (
        <p role="alert" className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function ItemRow({
  id,
  name,
  quantity,
  note,
  meta,
  bought,
}: {
  id: string;
  name: string;
  quantity: string | null;
  note: string | null;
  meta: string;
  bought: boolean;
}) {
  const [optimisticBought, setOptimisticBought] = useOptimistic(bought);
  const [removed, setRemoved] = useOptimistic(false);
  const [, startTransition] = useTransition();

  if (removed) return null;

  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={optimisticBought}
          onChange={(event) => {
            const next = event.target.checked;
            startTransition(async () => {
              setOptimisticBought(next);
              await setBought(id, next);
            });
          }}
          aria-label={optimisticBought ? `Angre at ${name} er kjøpt` : `Merk ${name} som kjøpt`}
          className="size-[22px] shrink-0 accent-accent"
        />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span
              className={`text-[15px] font-semibold ${optimisticBought ? "text-gray-500 line-through" : ""}`}
            >
              {name}
            </span>
            {quantity && <span className="text-sm text-gray-600">{quantity}</span>}
          </span>
          {note && <span className="text-sm text-gray-600">{note}</span>}
          <span className="text-xs text-gray-500">{meta}</span>
        </span>
      </label>
      {!optimisticBought && (
        <button
          type="button"
          aria-label={`Fjern ${name} fra lista`}
          onClick={() =>
            startTransition(async () => {
              setRemoved(true);
              await deleteItem(id);
            })
          }
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        >
          <XIcon size={18} />
        </button>
      )}
    </li>
  );
}
