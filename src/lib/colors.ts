// Fargene en beboer kan velge for appen sin.
// Alle har minst 4.5:1 kontrast mot hvit tekst, så knapper og kort er lesbare.

export const ACCENT_COLORS = [
  { id: "gronn", label: "Grønn", hex: "#0F766E" },
  { id: "turkis", label: "Turkis", hex: "#0E7490" },
  { id: "bla", label: "Blå", hex: "#2563EB" },
  { id: "indigo", label: "Indigo", hex: "#4F46E5" },
  { id: "lilla", label: "Lilla", hex: "#7E22CE" },
  { id: "rosa", label: "Rosa", hex: "#BE185D" },
  { id: "baer", label: "Bær", hex: "#BE123C" },
  { id: "oransje", label: "Oransje", hex: "#C2410C" },
  { id: "grafitt", label: "Grafitt", hex: "#111827" },
] as const;

export type AccentColorId = (typeof ACCENT_COLORS)[number]["id"];

export const DEFAULT_COLOR: AccentColorId = "gronn";

export function accentColor(id: string | null | undefined) {
  return ACCENT_COLORS.find((c) => c.id === id) ?? ACCENT_COLORS[0];
}

export function isAccentColorId(id: string): id is AccentColorId {
  return ACCENT_COLORS.some((c) => c.id === id);
}
