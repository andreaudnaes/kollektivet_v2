import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Page, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getEvent, listCategories } from "@/lib/calendar";
import { listResidents } from "@/lib/cleaning";
import { deleteEvent, updateEvent } from "../actions";
import { EventForm } from "../event-form";

export const metadata: Metadata = { title: "Hendelse – Kollektivet" };

export default function EventPage({ params }: PageProps<"/kalender/[id]">) {
  return (
    <Page>
      <Suspense fallback={<p className="pt-24 text-gray-500">Henter hendelsen …</p>}>
        <EditEvent params={params} />
      </Suspense>
    </Page>
  );
}

async function EditEvent({ params }: { params: PageProps<"/kalender/[id]">["params"] }) {
  const me = await getCurrentUser();
  const { id } = await params;
  const [event, categories, residents] = await Promise.all([getEvent(id), listCategories(), listResidents()]);
  if (!event) notFound();

  const author = event.createdBy === me.id ? "deg" : (residents.find((r) => r.id === event.createdBy)?.name ?? "ukjent");

  return (
    <>
      <PageHeader
        title={event.title}
        subtitle={`Lagt inn av ${author}`}
        back={{ href: `/kalender?visning=dag&dato=${event.startDate}`, label: "Tilbake til kalenderen" }}
      />
      <EventForm
        action={updateEvent.bind(null, event.id)}
        onDelete={deleteEvent.bind(null, event.id, event.startDate)}
        submitLabel="Lagre endringer"
        categories={categories.map(({ id, name, color }) => ({ id, name, color }))}
        initial={{
          title: event.title,
          description: event.description ?? "",
          categoryId: event.categoryId ?? "",
          startDate: event.startDate,
          startTime: event.startTime ?? "18:00",
          endDate: event.endDate,
          endTime: event.endTime ?? "",
          allDay: !event.startTime,
        }}
      />
    </>
  );
}
