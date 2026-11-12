import type { Metadata } from "next";
import { register } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Registrer deg – Kollektivet" };

export default function RegisterPage() {
  return <AuthForm mode="register" action={register} />;
}
