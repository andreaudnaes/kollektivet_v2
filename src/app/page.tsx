import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "./(auth)/actions";

const features = [
  { title: "Vaskeliste", description: "Hvem har ansvar for hva denne uka." },
  { title: "Handleliste", description: "Det som må kjøpes inn til fellesskapet." },
  { title: "Kalender", description: "Felles hendelser, besøk og bortreiser." },
  { title: "Beholdning", description: "Oversikt over felles forbruksvarer." },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-12">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Kollektivet</h1>
          <Suspense fallback={<p className="text-zinc-400">&nbsp;</p>}>
            <Greeting />
          </Suspense>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Logg ut
          </button>
        </form>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        {features.map((feature) => (
          <li
            key={feature.title}
            className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <h2 className="font-medium">{feature.title}</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {feature.description}
            </p>
            <p className="mt-3 text-xs uppercase tracking-wide text-zinc-400">Kommer snart</p>
          </li>
        ))}
      </ul>
    </main>
  );
}

async function Greeting() {
  const user = await getCurrentUser();
  return <p className="text-zinc-600 dark:text-zinc-400">Hei, {user.name}!</p>;
}
