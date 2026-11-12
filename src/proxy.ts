import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-cookie";

const PUBLIC_PATHS = ["/logg-inn", "/registrer"];

/**
 * Rask, «optimistisk» sjekk: sender folk uten session-cookie til innloggingssiden.
 * Selve valideringen av sessionen skjer på serveren i getCurrentUser().
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!hasSession && !isPublic) {
    return NextResponse.redirect(new URL("/logg-inn", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Kjør på alle sider unntatt Next.js-filer og statiske filer.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.[a-z0-9]+$).*)"],
};
