export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-5 py-12">
      <header className="space-y-1 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Kollektivet</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Felles oversikt for kollektivet</p>
      </header>
      {children}
    </main>
  );
}
