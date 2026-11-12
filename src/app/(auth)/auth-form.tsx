"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ui } from "@/components/ui";
import type { FormState } from "./actions";

type Props = {
  mode: "login" | "register";
  action: (state: FormState, formData: FormData) => Promise<FormState>;
};

const inputClass = ui.input;

export function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const isRegister = mode === "register";

  return (
    <form action={formAction} className="space-y-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-700">Navn</span>
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

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-gray-700">{isRegister ? "Velg en PIN-kode" : "PIN-kode"}</span>
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
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">Invitasjonskode</span>
          <input
            name="inviteCode"
            required
            autoComplete="off"
            autoCapitalize="none"
            className={inputClass}
          />
          <span className="block text-xs text-gray-500">Spør noen i kollektivet om koden.</span>
        </label>
      )}

      {state?.error && (
        <p role="alert" className="rounded-[14px] bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`${ui.primaryButton} w-full`}
      >
        {pending ? "Et øyeblikk …" : isRegister ? "Registrer deg" : "Logg inn"}
      </button>

      <p className="text-center text-sm text-gray-600">
        {isRegister ? (
          <>
            Har du allerede bruker?{" "}
            <Link href="/logg-inn" className="font-semibold text-accent underline">
              Logg inn
            </Link>
          </>
        ) : (
          <>
            Ny i kollektivet?{" "}
            <Link href="/registrer" className="font-semibold text-accent underline">
              Registrer deg
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
