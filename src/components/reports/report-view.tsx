"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { generatePDFWithGST, generatePDFWithoutGST } from "@/lib/pdf-report";
import {
  Download,
  FileText,
  Calendar,
  CalendarDays,
  IndianRupee,
  ReceiptText,
  TrendingUp,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import type { ReportInvoice } from "@/actions/reports";

interface ReportData {
  period: string;
  startDate: Date;
  endDate: Date;
  invoices: ReportInvoice[];
  summary: {
    totalInvoices: number;
    totalSales: number;
    totalSubtotal: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalTax: number;
    totalDiscount: number;
    gstInvoiceCount: number;
    gstTotal: number;
    nonGstInvoiceCount: number;
    nonGstTotal: number;
    paidCount: number;
    paidTotal: number;
    unpaidCount: number;
    unpaidTotal: number;
  };
}

interface ReportViewProps {
  data: ReportData;
  activePeriod: string;
}

export function ReportView({ data, activePeriod }: ReportViewProps) {
  const s = data.summary;

  return (
    <div className="space-y-6 mt-6">
      {/* Period Selector */}
      <div className="flex items-center gap-3">
        <Link href="/reports?period=daily">
          <Button
            variant={activePeriod === "daily" ? "default" : "outline"}
            size="sm"
            className={`gap-2 rounded-xl ${activePeriod === "daily"
              ? "bg-gradient-to-r from-[#C80018] to-[#FF0000] border-0 text-white shadow-md shadow-red-500/15"
              : "text-[#4B4E53] border-[#D8DEE4]"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Daily
          </Button>
        </Link>
        <Link href="/reports?period=weekly">
          <Button
            variant={activePeriod === "weekly" ? "default" : "outline"}
            size="sm"
            className={`gap-2 rounded-xl ${activePeriod === "weekly"
              ? "bg-gradient-to-r from-[#C80018] to-[#FF0000] border-0 text-white shadow-md shadow-red-500/15"
              : "text-[#4B4E53] border-[#D8DEE4]"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Weekly
          </Button>
        </Link>
        <Link href="/reports?period=monthly">
          <Button
            variant={activePeriod === "monthly" ? "default" : "outline"}
            size="sm"
            className={`gap-2 rounded-xl ${activePeriod === "monthly"
              ? "bg-gradient-to-r from-[#C80018] to-[#FF0000] border-0 text-white shadow-md shadow-red-500/15"
              : "text-[#4B4E53] border-[#D8DEE4]"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Monthly
          </Button>
        </Link>
        <div className="flex-1" />
        <span className="text-xs text-[#4B4E53]">
          {formatDate(data.startDate)} — {formatDate(data.endDate)}
        </span>
      </div>

      {/* Download Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => generatePDFWithGST(data)}
          className="premium-card rounded-2xl p-5 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C80018] to-[#FF0000] flex items-center justify-center shadow-md shadow-red-500/15">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1D1E27]">Download with GST</p>
              <p className="text-[11px] text-[#4B4E53]">SGST, CGST, IGST breakup & HSN codes</p>
            </div>
            <Download className="w-4 h-4 text-[#4B4E53]/30 ml-auto group-hover:text-[#C80018] transition-colors" />
          </div>
          <div className="flex gap-4 text-xs text-[#4B4E53]">
            <span>PDF format</span>
            <span>·</span>
            <span>{s.totalInvoices} invoices</span>
            <span>·</span>
            <span className="font-semibold text-[#1D1E27]">{formatCurrency(s.totalSales)}</span>
          </div>
        </button>

        <button
          onClick={() => generatePDFWithoutGST(data)}
          className="premium-card rounded-2xl p-5 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1D1E27] to-[#2D2E37] flex items-center justify-center shadow-md shadow-gray-500/15">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1D1E27]">Download without GST</p>
              <p className="text-[11px] text-[#4B4E53]">Net sales only — no tax columns</p>
            </div>
            <Download className="w-4 h-4 text-[#4B4E53]/30 ml-auto group-hover:text-[#1D1E27] transition-colors" />
          </div>
          <div className="flex gap-4 text-xs text-[#4B4E53]">
            <span>PDF format</span>
            <span>·</span>
            <span>{s.totalInvoices} invoices</span>
            <span>·</span>
            <span className="font-semibold text-[#1D1E27]">{formatCurrency(s.totalSubtotal - s.totalDiscount)}</span>
          </div>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={IndianRupee} label="Gross Sales" value={formatCurrency(s.totalSubtotal)} variant="red" />
        <SummaryCard icon={ReceiptText} label="Total Tax" value={formatCurrency(s.totalTax)} subtitle={`SGST: ${formatCurrency(s.totalSgst)} · CGST: ${formatCurrency(s.totalCgst)}`} variant="dark" />
        <SummaryCard icon={TrendingUp} label="Net Revenue" value={formatCurrency(s.totalSales)} variant="red" />
        {s.unpaidCount > 0 ? (
          <SummaryCard icon={AlertCircle} label="Outstanding" value={formatCurrency(s.unpaidTotal)} subtitle={`${s.unpaidCount} unpaid invoice${s.unpaidCount > 1 ? "s" : ""}`} variant="amber" />
        ) : (
          <SummaryCard icon={IndianRupee} label="All Paid" value={formatCurrency(s.paidTotal)} subtitle="No outstanding bills" variant="green" />
        )}
      </div>

      {/* Breakdown + Tax */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="premium-card-static rounded-2xl p-6">
          <h3 className="text-sm font-bold text-[#1D1E27] mb-4">Invoice Breakdown</h3>
          <div className="space-y-3">
            <BreakdownRow label="GST Invoices" count={s.gstInvoiceCount} amount={s.gstTotal} color="bg-[#C80018]" total={s.totalSales} />
            <BreakdownRow label="Cash Bills" count={s.nonGstInvoiceCount} amount={s.nonGstTotal} color="bg-[#1D1E27]" total={s.totalSales} />
          </div>
        </div>
        <div className="premium-card-static rounded-2xl p-6">
          <h3 className="text-sm font-bold text-[#1D1E27] mb-4">Tax Summary</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#E5EAF0]">
                <th className="text-left text-[#4B4E53] font-semibold py-2">Component</th>
                <th className="text-right text-[#4B4E53] font-semibold py-2">Rate</th>
                <th className="text-right text-[#4B4E53] font-semibold py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#EDF2F4]">
                <td className="py-2.5 text-[#1D1E27] font-medium">SGST</td>
                <td className="py-2.5 text-right text-[#4B4E53]">2.5%</td>
                <td className="py-2.5 text-right font-semibold text-[#1D1E27]">{formatCurrency(s.totalSgst)}</td>
              </tr>
              <tr className="border-b border-[#EDF2F4]">
                <td className="py-2.5 text-[#1D1E27] font-medium">CGST</td>
                <td className="py-2.5 text-right text-[#4B4E53]">2.5%</td>
                <td className="py-2.5 text-right font-semibold text-[#1D1E27]">{formatCurrency(s.totalCgst)}</td>
              </tr>
              {s.totalIgst > 0 && (
                <tr className="border-b border-[#EDF2F4]">
                  <td className="py-2.5 text-[#1D1E27] font-medium">IGST</td>
                  <td className="py-2.5 text-right text-[#4B4E53]">5%</td>
                  <td className="py-2.5 text-right font-semibold text-[#1D1E27]">{formatCurrency(s.totalIgst)}</td>
                </tr>
              )}
              <tr>
                <td className="py-2.5 text-[#1D1E27] font-bold" colSpan={2}>Total Tax Collected</td>
                <td className="py-2.5 text-right font-bold text-[#C80018]">{formatCurrency(s.totalTax)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice List */}
      <div className="premium-card-static rounded-2xl p-6">
        <h3 className="text-sm font-bold text-[#1D1E27] mb-4">All Invoices ({s.totalInvoices})</h3>
        {data.invoices.length === 0 ? (
          <p className="text-sm text-[#4B4E53] text-center py-8">No invoices in this period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#E5EAF0]">
                  <th className="text-left text-[#4B4E53] font-semibold py-2 pr-3 w-10">S.No.</th>
                  <th className="text-left text-[#4B4E53] font-semibold py-2 pr-3">Invoice</th>
                  <th className="text-left text-[#4B4E53] font-semibold py-2">Date</th>
                  <th className="text-left text-[#4B4E53] font-semibold py-2">Customer</th>
                  <th className="text-center text-[#4B4E53] font-semibold py-2">Type</th>
                  <th className="text-right text-[#4B4E53] font-semibold py-2">Subtotal</th>
                  <th className="text-right text-[#4B4E53] font-semibold py-2">Tax</th>
                  <th className="text-right text-[#4B4E53] font-semibold py-2">Total</th>
                  <th className="text-center text-[#4B4E53] font-semibold py-2">Status</th>
                  <th className="py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((inv, index) => (
                  <tr key={inv.invoiceNumber} className="border-b border-[#EDF2F4] hover:bg-[#FAFBFC] transition-colors">
                    <td className="py-2.5 pr-3 text-[#4B4E53] text-center">{index + 1}</td>
                    <td className="py-2.5 pr-3 font-semibold text-[#1D1E27]">{inv.invoiceNumber}</td>
                    <td className="py-2.5 text-[#4B4E53]">{formatDate(inv.createdAt)}</td>
                    <td className="py-2.5 text-[#1D1E27]">{inv.customerName || "Walk-in"}</td>
                    <td className="py-2.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        inv.type === "GST" ? "bg-[#C80018]/8 text-[#C80018]" : "bg-[#EDF2F4] text-[#4B4E53]"
                      }`}>{inv.type === "GST" ? "GST" : "Non-GST"}</span>
                    </td>
                    <td className="py-2.5 text-right text-[#4B4E53]">{formatCurrency(inv.subtotal)}</td>
                    <td className="py-2.5 text-right text-[#4B4E53]">{formatCurrency(inv.sgstAmount + inv.cgstAmount + inv.igstAmount)}</td>
                    <td className="py-2.5 text-right font-bold text-[#1D1E27]">{formatCurrency(inv.totalAmount)}</td>
                    <td className="py-2.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                        inv.paymentStatus === "PAID" ? "text-emerald-600" : inv.paymentStatus === "PARTIAL" ? "text-amber-600" : "text-red-600"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          inv.paymentStatus === "PAID" ? "bg-emerald-500" : inv.paymentStatus === "PARTIAL" ? "bg-amber-500" : "bg-red-500"
                        }`} />
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <Link href={`/billing/${(inv as any).id}`}>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#4B4E53]/30 hover:text-[#C80018] transition-colors" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, subtitle, variant }: {
  icon: React.ElementType; label: string; value: string; subtitle?: string;
  variant: "red" | "dark" | "amber" | "green";
}) {
  const styles = {
    red: "from-[#C80018] to-[#FF0000] shadow-red-500/15",
    dark: "from-[#1D1E27] to-[#2D2E37] shadow-gray-500/15",
    amber: "from-amber-500 to-amber-600 shadow-amber-500/15",
    green: "from-emerald-500 to-emerald-600 shadow-emerald-500/15",
  };
  return (
    <div className="premium-card-static rounded-2xl p-4">
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-md ${styles[variant]}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-[11px] font-semibold text-[#4B4E53] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold text-[#1D1E27] tracking-tight">{value}</p>
      {subtitle && <p className="text-[11px] text-[#4B4E53]/60 mt-1">{subtitle}</p>}
    </div>
  );
}

function BreakdownRow({ label, count, amount, color, total }: {
  label: string; count: number; amount: number; color: string; total: number;
}) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
          <span className="text-xs font-medium text-[#4B4E53]">{label}</span>
          <span className="text-[10px] text-[#4B4E53]/50">({count})</span>
        </div>
        <span className="text-xs font-bold text-[#1D1E27]">{formatCurrency(amount)}</span>
      </div>
      <div className="h-2 rounded-full bg-[#EDF2F4] overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
