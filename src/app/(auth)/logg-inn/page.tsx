import type { Metadata } from "next";
import { login } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Logg inn – Kollektivet" };

export default function LoginPage() {
  return <AuthForm mode="login" action={login} />;
}
