import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "@fontsource-variable/inter";
import "./globals.css";
import { accentColor } from "@/lib/colors";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Kollektivet",
  description: "Felles oversikt for kollektivet",
  // For iPhone: navn under ikonet og fullskjerm når appen åpnes fra hjemskjermen.
  appleWebApp: {
    capable: true,
    title: "Kollektivet",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5F6F8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nb" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Suspense fallback={null}>
          <ThemeStyle />
        </Suspense>
        {children}
      </body>
    </html>
  );
}

/** Setter aksentfargen til den innloggede beboerens valg. */
async function ThemeStyle() {
  const user = await getViewer();
  const { hex } = accentColor(user?.color);
  return <style>{`:root{--accent:${hex}}`}</style>;
}
