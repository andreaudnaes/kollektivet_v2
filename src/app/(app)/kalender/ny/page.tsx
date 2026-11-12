import type { Metadata } from "next";
import { Suspense } from "react";
import { Page, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { listCategories } from "@/lib/calendar";
import { isDate } from "@/lib/dates";
import { todayInOslo } from "@/lib/weeks";
import { createEvent } from "../actions";
import { EventForm } from "../event-form";

export const metadata: Metadata = { title: "Ny hendelse – Kollektivet" };

export default function NewEventPage({ searchParams }: PageProps<"/kalender/ny">) {
  return (
    <Page>
      <Suspense fallback={<p className="pt-24 text-gray-500">Et øyeblikk …</p>}>
        <NewEvent searchParams={searchParams} />
      </Suspense>
    </Page>
  );
}

async function NewEvent({ searchParams }: { searchParams: PageProps<"/kalender/ny">["searchParams"] }) {
  await getCurrentUser();
  const { dato } = await searchParams;
  const date = typeof dato === "string" && isDate(dato) ? dato : todayInOslo();
  const categories = await listCategories();

  return (
    <>
      <PageHeader
        title="Ny hendelse"
        back={{ href: `/kalender?visning=maned&dato=${date}`, label: "Tilbake til kalenderen" }}
      />
      <EventForm
        action={createEvent}
        submitLabel="Legg til i kalenderen"
        categories={categories.map(({ id, name, color }) => ({ id, name, color }))}
        initial={{
          title: "",
          description: "",
          categoryId: "",
          startDate: date,
          startTime: "18:00",
          endDate: date,
          endTime: "",
          allDay: false,
        }}
      />
    </>
  );
}
