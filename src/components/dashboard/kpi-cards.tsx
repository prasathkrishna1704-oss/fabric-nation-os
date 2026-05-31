import { formatCurrency } from "@/lib/format";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Package,
  AlertTriangle,
  ReceiptText,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
  variant?: "red" | "dark" | "gray" | "amber";
  stagger?: string;
}

const variantConfig = {
  red: {
    gradient: "from-[#FF0000]/8 via-[#C80018]/4 to-transparent",
    iconBg: "from-[#FF0000] to-[#C80018]",
    glow: "shadow-red-500/15",
    dot: "bg-[#FF0000]",
  },
  dark: {
    gradient: "from-[#1D1E27]/8 via-[#1D1E27]/4 to-transparent",
    iconBg: "from-[#1D1E27] to-[#2D2E37]",
    glow: "shadow-[#1D1E27]/15",
    dot: "bg-[#1D1E27]",
  },
  gray: {
    gradient: "from-[#4B4E53]/8 via-[#4B4E53]/4 to-transparent",
    iconBg: "from-[#4B4E53] to-[#5B5E63]",
    glow: "shadow-[#4B4E53]/15",
    dot: "bg-[#4B4E53]",
  },
  amber: {
    gradient: "from-amber-500/8 via-amber-500/4 to-transparent",
    iconBg: "from-amber-500 to-amber-600",
    glow: "shadow-amber-500/15",
    dot: "bg-amber-500",
  },
};

function KpiCard({ title, value, subtitle, icon: Icon, trend, variant = "red", stagger }: KpiCardProps) {
  const config = variantConfig[variant];

  return (
    <div className={cn(
      "relative rounded-2xl premium-card p-5 overflow-hidden animate-slide-up",
      stagger
    )}>
      {/* Background gradient accent */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl rounded-full opacity-80 -translate-y-8 translate-x-8 blur-2xl pointer-events-none",
        config.gradient
      )} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
            <p className="text-[11px] font-semibold text-[#4B4E53] uppercase tracking-[0.12em]">{title}</p>
          </div>
          <p className="text-2xl font-bold text-[#1D1E27] tracking-tight truncate">{value}</p>
          {subtitle && (
            <p className="text-xs text-[#4B4E53]/70 mt-1.5 font-medium">{subtitle}</p>
          )}
          {trend && (
            <div className={cn("flex items-center gap-1.5 mt-3 text-xs font-semibold",
              trend.value >= 0 ? "text-emerald-600" : "text-red-600"
            )}>
              <div className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5",
                trend.value >= 0 ? "bg-emerald-50" : "bg-red-50"
              )}>
                {trend.value >= 0
                  ? <ArrowUpRight className="w-3 h-3" />
                  : <TrendingDown className="w-3 h-3" />}
                <span>{Math.abs(trend.value)}%</span>
              </div>
              <span className="text-[#4B4E53]/60 font-medium">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br shadow-lg",
          config.iconBg,
          config.glow
        )}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

interface KpiCardsProps {
  todaySales: number;
  todayCount: number;
  monthlySales: number;
  monthlyCount: number;
  pendingGST: number;
  totalStockValue: number;
  totalProducts: number;
  lowStockCount: number;
}

export function KpiCards({
  todaySales,
  todayCount,
  monthlySales,
  monthlyCount,
  pendingGST,
  totalStockValue,
  totalProducts,
  lowStockCount,
}: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <KpiCard
        title="Today's Sales"
        value={formatCurrency(todaySales)}
        subtitle={`${todayCount} invoice${todayCount !== 1 ? "s" : ""} today`}
        icon={IndianRupee}
        variant="red"
        stagger="stagger-1"
      />
      <KpiCard
        title="Monthly Revenue"
        value={formatCurrency(monthlySales)}
        subtitle={`${monthlyCount} invoices this month`}
        icon={TrendingUp}
        variant="dark"
        stagger="stagger-2"
      />
      <KpiCard
        title="GST Liability"
        value={formatCurrency(pendingGST)}
        subtitle="Collected this month"
        icon={ReceiptText}
        variant="gray"
        stagger="stagger-3"
      />
      <KpiCard
        title="Stock Value"
        value={formatCurrency(totalStockValue)}
        subtitle={`${totalProducts} products · ${lowStockCount} low stock`}
        icon={lowStockCount > 0 ? AlertTriangle : Package}
        variant={lowStockCount > 0 ? "amber" : "gray"}
        stagger="stagger-4"
      />
    </div>
  );
}
