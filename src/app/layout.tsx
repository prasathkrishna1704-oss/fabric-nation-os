import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fabric Nation — Billing & Inventory",
  description: "Production-ready billing and inventory management system for fabric stores. GST invoicing, stock tracking, and analytics.",
  keywords: ["fabric store", "billing", "inventory", "GST", "POS"],
};

import { AppShell } from "@/components/layout/app-shell";
import { getUserRole } from "@/actions/auth";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const role = await getUserRole();
  
  return (
    <html lang="en" className={`${inter.variable} font-sans h-full antialiased`}>
      <body className="min-h-full flex bg-background text-foreground">
        <TooltipProvider>
          <AppShell role={role}>
            {children}
          </AppShell>
        </TooltipProvider>
      </body>
    </html>
  );
}
