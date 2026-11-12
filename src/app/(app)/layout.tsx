import { Suspense } from "react";
import { BottomNav, NavBar } from "@/components/bottom-nav";
import { RefreshOnReturn } from "@/components/refresh-on-return";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {children}
      <Suspense fallback={<NavBar pathname={null} />}>
        <BottomNav />
      </Suspense>
      <RefreshOnReturn />
    </>
  );
}
