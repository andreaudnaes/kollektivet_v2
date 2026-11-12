// Farger for kalenderkategorier. Hver har en sterk farge (prikker og streker),
// en mørk tekstfarge og en lys bakgrunn, valgt så teksten er lett å lese.

export const CATEGORY_COLORS = [
  { id: "rod", label: "Rød", hex: "#DC2626", text: "#991B1B", bg: "#FEE2E2" },
  { id: "oransje", label: "Oransje", hex: "#EA580C", text: "#9A3412", bg: "#FFEDD5" },
  { id: "gul", label: "Gul", hex: "#CA8A04", text: "#854D0E", bg: "#FEF9C3" },
  { id: "gronn", label: "Grønn", hex: "#16A34A", text: "#166534", bg: "#DCFCE7" },
  { id: "turkis", label: "Turkis", hex: "#0D9488", text: "#115E59", bg: "#CCFBF1" },
  { id: "bla", label: "Blå", hex: "#2563EB", text: "#1E40AF", bg: "#DBEAFE" },
  { id: "indigo", label: "Indigo", hex: "#4F46E5", text: "#3730A3", bg: "#E0E7FF" },
  { id: "lilla", label: "Lilla", hex: "#9333EA", text: "#6B21A8", bg: "#F3E8FF" },
  { id: "rosa", label: "Rosa", hex: "#DB2777", text: "#9D174D", bg: "#FCE7F3" },
  { id: "gra", label: "Grå", hex: "#6B7280", text: "#374151", bg: "#F3F4F6" },
] as const;

export type CategoryColorId = (typeof CATEGORY_COLORS)[number]["id"];

/** Brukes for hendelser uten kategori, og for ukjente farge-id-er. */
export const NO_CATEGORY_COLOR = CATEGORY_COLORS[CATEGORY_COLORS.length - 1];

export function categoryColor(id: string | null | undefined) {
  return CATEGORY_COLORS.find((c) => c.id === id) ?? NO_CATEGORY_COLOR;
}

export function isCategoryColorId(id: string): id is CategoryColorId {
  return CATEGORY_COLORS.some((c) => c.id === id);
}

export const DEFAULT_CATEGORIES: { name: string; color: CategoryColorId }[] = [
  { name: "Fest", color: "lilla" },
  { name: "Besøk", color: "bla" },
  { name: "Bortreist", color: "oransje" },
  { name: "Møte", color: "turkis" },
  { name: "Annet", color: "gra" },
];
