import Link from "next/link";

type LinkProps = { href: string; label: string };

export function PageHeader({
  title,
  back,
  action,
}: {
  title: string;
  back?: LinkProps;
  action?: LinkProps;
}) {
  return (
    <header className="space-y-3">
      {back && (
        <Link href={back.href} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          ← {back.label}
        </Link>
      )}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {action && (
          <Link
            href={action.href}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            {action.label}
          </Link>
        )}
      </div>
    </header>
  );
}
