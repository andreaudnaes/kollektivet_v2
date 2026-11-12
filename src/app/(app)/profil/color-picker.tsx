"use client";

import { useOptimistic, useTransition } from "react";
import { CheckIcon } from "@/components/icons";
import { ACCENT_COLORS } from "@/lib/colors";
import { setColor } from "./actions";

export function ColorPicker({ current }: { current: string }) {
  const [selected, setSelected] = useOptimistic(current);
  const [, startTransition] = useTransition();

  const choose = (id: string) =>
    startTransition(async () => {
      setSelected(id);
      // Vis fargen med en gang, før serveren har svart.
      const hex = ACCENT_COLORS.find((c) => c.id === id)?.hex;
      if (hex) document.documentElement.style.setProperty("--accent", hex);
      await setColor(id);
      // Nå har serveren sendt den nye fargen, så den midlertidige kan fjernes.
      document.documentElement.style.removeProperty("--accent");
    });

  return (
    <fieldset className="grid grid-cols-3 gap-3">
      <legend className="sr-only">Velg farge</legend>
      {ACCENT_COLORS.map((color) => {
        const isSelected = color.id === selected;
        return (
          <label
            key={color.id}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl bg-white p-3 transition hover:bg-gray-50 ${
              isSelected ? "ring-2 ring-gray-900" : "ring-1 ring-gray-200"
            }`}
          >
            <input
              type="radio"
              name="color"
              value={color.id}
              checked={isSelected}
              onChange={() => choose(color.id)}
              className="sr-only"
            />
            <span
              className="flex size-11 items-center justify-center rounded-full text-white"
              style={{ background: color.hex }}
            >
              {isSelected && <CheckIcon size={20} />}
            </span>
            <span className={`text-sm ${isSelected ? "font-semibold" : "text-gray-700"}`}>
              {color.label}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
