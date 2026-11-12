import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Page, PageHeader, Section, ui } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { listCategories } from "@/lib/calendar";
import { CATEGORY_COLORS } from "@/lib/calendar-colors";
import { createCategory, deleteCategory, updateCategory } from "../actions";

export const metadata: Metadata = { title: "Kategorier – Kollektivet" };

export default function CategoriesPage() {
  return (
    <Page>
      <PageHeader
        title="Kategorier"
        subtitle="Kalender"
        back={{ href: "/kalender", label: "Tilbake til kalenderen" }}
      />
      <Suspense fallback={<p className="text-gray-500">Henter kategorier …</p>}>
        <Categories />
      </Suspense>
    </Page>
  );
}

function ColorChoices({ name, selected }: { name: string; selected: string }) {
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">Farge</legend>
      {CATEGORY_COLORS.map((c) => (
        <label key={c.id} className="cursor-pointer" title={c.label}>
          <input
            type="radio"
            name={name}
            value={c.id}
            defaultChecked={c.id === selected}
            aria-label={c.label}
            className="peer sr-only"
          />
          <span
            className="block size-9 rounded-full ring-offset-2 transition peer-checked:ring-2 peer-checked:ring-gray-900 peer-focus-visible:ring-2 peer-focus-visible:ring-accent"
            style={{ background: c.hex }}
          />
        </label>
      ))}
    </fieldset>
  );
}

async function Categories() {
  // Hentes ved hvert besøk (ikke på forhånd), siden siden brukes sjelden.
  await connection();
  await getCurrentUser();
  const categories = await listCategories();

  return (
    <>
      <Section
        title="Kategorier"
        description="Gi hver kategori en farge. Sletter du en kategori, beholdes hendelsene, men de blir grå."
      >
        <ul className="flex flex-col gap-3">
          {categories.map((category) => (
            <li key={category.id} className={`${ui.card} flex flex-col gap-3 p-4`}>
              <form action={updateCategory.bind(null, category.id)} className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <label className="sr-only" htmlFor={`name-${category.id}`}>
                    Navn
                  </label>
                  <input
                    id={`name-${category.id}`}
                    name="name"
                    required
                    maxLength={30}
                    defaultValue={category.name}
                    className={`${ui.input} h-11 bg-gray-50`}
                  />
                  <button type="submit" className={`${ui.secondaryButton} shrink-0`}>
                    Lagre
                  </button>
                </div>
                <ColorChoices name="color" selected={category.color} />
              </form>
              <form action={deleteCategory.bind(null, category.id)}>
                <button type="submit" className="min-h-11 text-sm font-medium text-red-700 underline">
                  Slett {category.name}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Ny kategori">
        <form action={createCategory} className={`${ui.card} flex flex-col gap-3 p-4`}>
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="new-category">
              Navn på ny kategori
            </label>
            <input
              id="new-category"
              name="name"
              required
              maxLength={30}
              placeholder="F.eks. Middag"
              className={`${ui.input} h-11 bg-gray-50`}
            />
            <button type="submit" className={`${ui.primaryButton} h-11 shrink-0`}>
              Legg til
            </button>
          </div>
          <ColorChoices name="color" selected="bla" />
        </form>
      </Section>
    </>
  );
}
