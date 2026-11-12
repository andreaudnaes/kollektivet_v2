import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Kalles fra Server Actions etter en endring. Oppdaterer siden man står på,
 * og tømmer appens minne av andre sider, så ingen viser gamle data.
 */
export function invalidateAll() {
  revalidatePath("/", "layout");
}
