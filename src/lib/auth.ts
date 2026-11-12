import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "./session";

export type CurrentUser = { id: string; name: string; color: string | null };

/**
 * Henter innlogget bruker, eller sender til innloggingssiden.
 * Bruk denne i alle sider og Server Actions som krever innlogging.
 * `cache` gjør at databasen bare spørres én gang per forespørsel.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const user = await getSessionUser();
  if (!user) redirect("/logg-inn");
  return user;
});
