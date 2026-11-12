import type { Metadata } from "next";
import { Suspense } from "react";
import { Page, PageHeader, Section, ui } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { listResidents } from "@/lib/cleaning";
import { BOUGHT_VISIBLE_DAYS, getShoppingList, getSuggestions } from "@/lib/shopping";
import { todayInOslo } from "@/lib/weeks";
import { AddItemForm, ItemRow } from "./shopping-controls";

export const metadata: Metadata = { title: "Handleliste – Kollektivet" };

export default function ShoppingPage() {
  return (
    <Page>
      <Suspense fallback={<p className="pt-24 text-gray-500">Henter handlelista …</p>}>
        <ShoppingList />
      </Suspense>
    </Page>
  );
}

async function ShoppingList() {
  const me = await getCurrentUser();
  const [{ open, bought }, suggestions, residents] = await Promise.all([
    getShoppingList(),
    getSuggestions(),
    listResidents(),
  ]);
  const names = new Map(residents.map((r) => [r.id, r.name]));
  const nameOf = (id: string | null) =>
    id === me.id ? "deg" : id ? (names.get(id) ?? "ukjent") : "ukjent";

  // Forslag: bare det som ikke allerede står på lista.
  const openNames = new Set(open.map((i) => i.name.toLowerCase()));
  const freshSuggestions = suggestions.filter((s) => !openNames.has(s.toLowerCase()));

  return (
    <>
      <PageHeader
        title="Handleliste"
        subtitle={
          open.length === 0 ? "Ingenting å kjøpe akkurat nå" : `${open.length} ${open.length === 1 ? "vare" : "varer"} å kjøpe`
        }
        back={{ href: "/", label: "Tilbake til forsiden" }}
      />

      <AddItemForm suggestions={freshSuggestions} />

      {open.length > 0 ? (
        <ul className={`${ui.card} divide-y divide-gray-100`}>
          {open.map((item) => (
            <ItemRow
              key={item.id}
              id={item.id}
              name={item.name}
              quantity={item.quantity}
              note={item.note}
              bought={false}
              meta={`Lagt til av ${nameOf(item.addedBy)} ${relativeDay(item.createdAt)}`}
            />
          ))}
        </ul>
      ) : (
        <p className="py-6 text-center text-gray-600">Lista er tom. Legg til det dere trenger over.</p>
      )}

      {bought.length > 0 && (
        <Section
          title="Handlet"
          description={`Vises i ${BOUGHT_VISIBLE_DAYS} dager. Fjern haken hvis noe ble krysset av ved en feil.`}
        >
          <ul className={`${ui.card} divide-y divide-gray-100`}>
            {bought.map((item) => (
              <ItemRow
                key={item.id}
                id={item.id}
                name={item.name}
                quantity={item.quantity}
                note={item.note}
                bought
                meta={`Kjøpt av ${nameOf(item.boughtBy)} ${item.boughtAt ? relativeDay(item.boughtAt) : ""}`}
              />
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}

/** «i dag 14:30», «i går 09:10» eller «tirsdag». */
function relativeDay(date: Date) {
  const day = todayInOslo(date);
  const today = todayInOslo();
  const yesterday = todayInOslo(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const time = date.toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Oslo",
  });
  if (day === today) return `i dag ${time}`;
  if (day === yesterday) return `i går ${time}`;
  return date.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "short", timeZone: "Europe/Oslo" });
}
