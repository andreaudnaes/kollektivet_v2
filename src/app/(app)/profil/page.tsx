import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Page, PageHeader, Section, ui } from "@/components/ui";
import { getViewer } from "@/lib/viewer";
import { DEFAULT_COLOR, accentColor } from "@/lib/colors";
import { logout } from "../../(auth)/actions";
import { ColorPicker } from "./color-picker";

export const metadata: Metadata = { title: "Profil – Kollektivet" };

export default function ProfilePage() {
  return (
    <Page>
      <PageHeader title="Profil" back={{ href: "/", label: "Tilbake til forsiden" }} />
      <Suspense fallback={<p className="text-gray-500">Henter profilen …</p>}>
        <Profile />
      </Suspense>
    </Page>
  );
}

async function Profile() {
  const me = await getViewer();
  if (!me) redirect("/logg-inn");
  const color = me.color ? accentColor(me.color).id : DEFAULT_COLOR;

  return (
    <>
      <div className={`${ui.card} flex items-center gap-4 p-5`}>
        <span className="flex size-12 items-center justify-center rounded-full bg-accent text-lg font-bold text-white">
          {me.name.charAt(0).toUpperCase()}
        </span>
        <span className="flex flex-col">
          <span className="text-lg font-semibold">{me.name}</span>
          <span className="text-sm text-gray-600">Beboer i kollektivet</span>
        </span>
      </div>

      <Section title="Farge" description="Velg fargen appen skal ha for deg. De andre ser sin egen farge.">
        <ColorPicker current={color} />
      </Section>

      <form action={logout} className="pt-2">
        <button type="submit" className={`${ui.secondaryButton} w-full`}>
          Logg ut
        </button>
      </form>
    </>
  );
}
