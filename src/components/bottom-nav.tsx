"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, CartIcon, CleaningIcon, HomeIcon } from "./icons";

const items = [
  { href: "/", label: "Hjem", Icon: HomeIcon },
  { href: "/vaskeliste", label: "Vask", Icon: CleaningIcon },
  { href: null, label: "Handle", Icon: CartIcon },
  { href: null, label: "Kalender", Icon: CalendarIcon },
] as const;

export function BottomNav() {
  return <NavBar pathname={usePathname()} />;
}

/** Selve menyen. Brukes også uten aktiv fane mens siden lastes. */
export function NavBar({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Hovedmeny"
      className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-xl px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="grid grid-cols-4 gap-1 rounded-3xl bg-white p-2 shadow-[0_4px_16px_rgba(17,24,39,0.10)]">
        {items.map(({ href, label, Icon }) => {
          if (!href) {
            return (
              <span
                key={label}
                className="flex flex-col items-center gap-1 py-2 text-[11px] font-medium text-gray-400"
                title="Kommer snart"
              >
                <Icon size={22} />
                {label}
              </span>
            );
          }
          const active = pathname !== null && (href === "/" ? pathname === "/" : pathname.startsWith(href));
          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] transition ${
                active
                  ? "bg-accent-tint font-semibold text-accent"
                  : "font-medium text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon size={22} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
