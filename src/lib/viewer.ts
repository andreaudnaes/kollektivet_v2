import "server-only";
import { cacheLife } from "next/cache";
import { CLIENT_STALE_SECONDS } from "./page-cache";
import { getSessionUser } from "./session";

/**
 * Innlogget bruker, hurtigbufret i nettleseren til denne brukeren.
 * Brukes der siden skal kunne hentes på forhånd (fargen i layouten).
 */
export async function getViewer() {
  "use cache: private";
  cacheLife({ stale: CLIENT_STALE_SECONDS });
  return getSessionUser();
}
