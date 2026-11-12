"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "./actions";

type Props = {
  mode: "login" | "register";
  action: (state: FormState, formData: FormData) => Promise<FormState>;
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-300";

export function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const isRegister = mode === "register";

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Navn</span>
        <input
          name="name"
          required
          maxLength={40}
          autoComplete="username"
          autoCapitalize="words"
          defaultValue={state?.name}
          className={inputClass}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{isRegister ? "Velg en PIN-kode" : "PIN-kode"}</span>
        <input
          name="pin"
          type="password"
          required
          inputMode="numeric"
          pattern="\d{4}"
          minLength={4}
          maxLength={4}
          autoComplete={isRegister ? "new-password" : "current-password"}
          placeholder="4 siffer"
          className={`${inputClass} tracking-[0.5em] placeholder:tracking-normal`}
        />
      </label>

      {isRegister && (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Invitasjonskode</span>
          <input
            name="inviteCode"
            required
            autoComplete="off"
            autoCapitalize="none"
            className={inputClass}
          />
          <span className="block text-xs text-zinc-500">Spør noen i kollektivet om koden.</span>
        </label>
      )}

      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? "Et øyeblikk …" : isRegister ? "Registrer deg" : "Logg inn"}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        {isRegister ? (
          <>
            Har du allerede bruker?{" "}
            <Link href="/logg-inn" className="font-medium text-zinc-900 underline dark:text-zinc-100">
              Logg inn
            </Link>
          </>
        ) : (
          <>
            Ny i kollektivet?{" "}
            <Link href="/registrer" className="font-medium text-zinc-900 underline dark:text-zinc-100">
              Registrer deg
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
