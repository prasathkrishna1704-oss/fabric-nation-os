"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

export function AppShell({ children, role }: { children: React.ReactNode, role?: string | null }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar role={role} />
      <main className="flex-1 min-h-screen overflow-y-auto">
        {children}
      </main>
    </>
  );
}
