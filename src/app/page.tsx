const features = [
  { title: "Vaskeliste", description: "Hvem har ansvar for hva denne uka." },
  { title: "Handleliste", description: "Det som må kjøpes inn til fellesskapet." },
  { title: "Kalender", description: "Felles hendelser, besøk og bortreiser." },
  { title: "Beholdning", description: "Oversikt over felles forbruksvarer." },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Kollektivet</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          En app som gjør samarbeidet i kollektivet enklere og mer oversiktlig.
        </p>
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
