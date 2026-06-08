"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  ChevronRight,
  Scissors,
  BarChart3,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/actions/auth";
import { Logo } from "@/components/ui/logo";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Billing",
    href: "/billing",
    icon: FileText,
    children: [
      { label: "All Invoices", href: "/billing" },
      { label: "New Invoice", href: "/billing/new" },
    ],
  },
  {
    label: "Inventory",
    href: "/inventory",
    icon: Package,
    children: [
      { label: "All Products", href: "/inventory" },
      { label: "Update Stock", href: "/inventory/update" },
      { label: "Stock Ledger", href: "/inventory/ledger" },
    ],
  },
  {
    label: "Customers",
    href: "/customers",
    icon: Users,
    children: [
      { label: "All Customers", href: "/customers" },
      { label: "Add Customer", href: "/customers/new" },
    ],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
];

export function Sidebar({ role }: { role?: string | null }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 min-h-screen flex flex-col sidebar-premium sticky top-0 shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/[0.08]">
        <div className="w-9 h-9 flex items-center justify-center shrink-0 bg-white rounded-lg p-1">
          <Logo className="w-full h-full" />
        </div>
        <div className="leading-tight">
          <p className="text-white font-bold text-sm tracking-tight">Fabric Nation</p>
          <p className="text-white/30 text-[10px] font-medium">Billing & Inventory</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-5 px-3 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25 px-3 mb-3">Navigation</p>
        {navItems.map((item) => {
          if (item.label === "Reports" && role !== "admin") return null;
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 group relative",
                  active
                    ? "sidebar-nav-active text-white"
                    : "text-white/45 hover:text-white/80 hover:bg-white/[0.04]"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
                  active
                    ? "bg-gradient-to-br from-[#FF0000] to-[#C80018] shadow-lg shadow-red-500/20"
                    : "bg-white/[0.04] group-hover:bg-white/[0.08]"
                )}>
                  <Icon className={cn("w-4 h-4 shrink-0", active ? "text-white" : "text-white/50 group-hover:text-white/70")} />
                </div>
                <span className="flex-1">{item.label}</span>
                {item.children && (
                  <ChevronRight className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200",
                    active && "rotate-90 text-red-400"
                  )} />
                )}
              </Link>

              {/* Sub-nav */}
              {item.children && active && (
                <div className="ml-8 mt-1 space-y-0.5 border-l border-white/[0.08] pl-4 mb-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "flex items-center py-1.5 px-2 rounded-lg text-xs transition-all duration-200",
                        pathname === child.href
                          ? "text-red-400 font-semibold bg-red-500/[0.08]"
                          : "text-white/35 hover:text-white/60 hover:bg-white/[0.03]"
                      )}
                    >
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full mr-2.5 transition-colors",
                        pathname === child.href ? "bg-red-400" : "bg-white/15"
                      )} />
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/[0.08] space-y-3">
        <div className="rounded-xl p-3 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(255, 0, 0, 0.06) 0%, rgba(200, 0, 24, 0.03) 100%)" }}
        >
          <p className="text-[10px] text-red-400/60 font-semibold uppercase tracking-[0.15em] mb-1">Shop</p>
          <p className="text-xs text-white/80 font-semibold">Fabric Nation</p>
          <p className="text-[10px] text-white/30 mt-0.5">Tirupur · GSTIN: 33BCMPV5075R1ZK</p>
        </div>
        <button 
          onClick={() => logout()} 
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
