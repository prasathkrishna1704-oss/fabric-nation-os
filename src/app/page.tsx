import { getDashboardData } from "@/actions/dashboard";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { SalesChart, TopProductsChart } from "@/components/dashboard/sales-chart";
import { LowStockAlert } from "@/components/dashboard/low-stock-alert";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, FileText, TrendingUp, BarChart3, AlertTriangle, ArrowUpRight, Sparkles, Package } from "lucide-react";

export const metadata = {
  title: "Dashboard — Fabric Nation",
  description: "Overview of sales, inventory, and GST metrics for your fabric store",
};

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="p-6 lg:p-8 max-w-[1440px] mx-auto space-y-7 animate-fade-in">
      <PageHeader
        title="Dashboard"
        description={`Good ${getGreeting()} · ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
      >
        <Link href="/billing/new">
          <Button size="sm" className="gap-2 bg-gradient-to-r from-[#C80018] to-[#FF0000] hover:from-[#B00015] hover:to-[#E60000] border-0 shadow-lg shadow-red-500/15 text-white font-semibold rounded-xl px-5 transition-all duration-200 hover:shadow-red-500/25 hover:scale-[1.02]">
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </Link>
      </PageHeader>

      {/* KPI Cards */}
      <KpiCards
        todaySales={data.todaySales}
        todayCount={data.todayCount}
        todayWeight={data.todayWeight}
        monthlySales={data.monthlySales}
        monthlyCount={data.monthlyCount}
        monthlyWeight={data.monthlyWeight}
        pendingGST={data.pendingGST}
        totalStockValue={data.totalStockValue}
        totalProducts={data.totalProducts}
        lowStockCount={data.lowStockProducts.length}
        totalStockUnits={data.totalStockUnits}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Sales Trend */}
        <div className="xl:col-span-2 rounded-2xl premium-card-static p-6 animate-slide-up stagger-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1D1E27]/[0.06] flex items-center justify-center">
                <BarChart3 className="w-4.5 h-4.5 text-[#1D1E27]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1D1E27]">Sales Trend</h2>
                <p className="text-[11px] text-[#4B4E53]/60 mt-0.5">Last 7 days — GST vs Cash Bills</p>
              </div>
            </div>
            <Link href="/billing">
              <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-[#4B4E53] hover:text-[#1D1E27] hover:bg-[#EDF2F4] rounded-lg">
                <FileText className="w-3.5 h-3.5" />
                All Invoices
              </Button>
            </Link>
          </div>
          <SalesChart data={data.salesTrend} />
        </div>

        {/* Top Products */}
        <div className="rounded-2xl premium-card-static p-6 animate-slide-up stagger-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-[#C80018]/[0.06] flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5 text-[#C80018]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1D1E27]">Top Fabrics</h2>
              <p className="text-[11px] text-[#4B4E53]/60 mt-0.5">Best selling this month</p>
            </div>
          </div>
          {data.topProducts.length > 0 ? (
            <TopProductsChart data={data.topProducts} />
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Sparkles className="w-6 h-6 text-[#4B4E53]/25 mb-2" />
              <p className="text-sm text-[#4B4E53]/50">No sales this month yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Recent Invoices */}
        <div className="rounded-2xl premium-card-static p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1D1E27]/[0.06] flex items-center justify-center">
                <FileText className="w-4.5 h-4.5 text-[#1D1E27]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1D1E27]">Recent Invoices</h2>
                <p className="text-[11px] text-[#4B4E53]/60 mt-0.5">Latest 5 transactions</p>
              </div>
            </div>
            <Link href="/billing">
              <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-[#4B4E53] hover:text-[#1D1E27] hover:bg-[#EDF2F4] rounded-lg">
                View all
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
          <RecentInvoices invoices={data.recentInvoices} />
        </div>

        {/* Low Stock */}
        <div className="rounded-2xl premium-card-static p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                data.lowStockProducts.length > 0
                  ? "bg-amber-50"
                  : "bg-emerald-50"
              }`}>
                {data.lowStockProducts.length > 0
                  ? <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
                  : <Package className="w-4.5 h-4.5 text-emerald-600" />
                }
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1D1E27]">Low Stock Alerts</h2>
                <p className="text-[11px] text-[#4B4E53]/60 mt-0.5">
                  {data.lowStockProducts.length > 0
                    ? `${data.lowStockProducts.length} fabric${data.lowStockProducts.length > 1 ? "s" : ""} need restocking`
                    : "All stock levels are healthy"}
                </p>
              </div>
            </div>
            <Link href="/inventory/update">
              <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-[#4B4E53] hover:text-[#1D1E27] hover:bg-[#EDF2F4] rounded-lg">
                <Plus className="w-3.5 h-3.5" />
                Update Stock
              </Button>
            </Link>
          </div>
          <LowStockAlert products={data.lowStockProducts} />
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
