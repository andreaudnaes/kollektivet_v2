import Link from "next/link";
import type { ReactNode } from "react";
import { BackIcon } from "./icons";

// Felles stiler for designet («Klar»). Endre her, så endres hele appen.
export const ui = {
  card: "rounded-[20px] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.06)]",
  iconButton:
    "flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-gray-900 shadow-[0_1px_2px_rgba(17,24,39,0.08)] transition hover:bg-gray-50",
  primaryButton:
    "inline-flex h-12 items-center justify-center rounded-[14px] bg-accent px-5 text-[15px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60",
  secondaryButton:
    "inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-gray-900 ring-1 ring-gray-200 transition hover:bg-gray-50 disabled:opacity-40",
  smallButton:
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-50 disabled:opacity-30",
  input:
    "h-12 w-full rounded-[14px] border-0 bg-white px-4 text-base text-gray-900 ring-1 ring-gray-200 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-accent",
  sectionLabel: "text-[13px] font-semibold uppercase tracking-[0.06em] text-gray-600",
};

/** Side med luft rundt og plass til bunnmenyen. */
export function Page({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-6 pt-12 pb-32">
      {children}
    </main>
  );
}

/** Topp med tilbakeknapp, valgfri knapp til høyre og tittel. */
export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: { href: string; label: string };
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4">
      {(back || action) && (
        <div className="flex items-center justify-between">
          {back ? (
            <Link href={back.href} aria-label={back.label} className={ui.iconButton}>
              <BackIcon />
            </Link>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h1 className="text-[30px] font-bold tracking-[-0.02em]">{title}</h1>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
    </header>
  );
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className={ui.sectionLabel}>{title}</h2>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
      {children}
    </section>
  );
}
