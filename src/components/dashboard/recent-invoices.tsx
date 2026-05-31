import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrowUpRight, CreditCard, Banknote, Smartphone, Clock } from "lucide-react";

interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  type: string;
  customerName: string | null;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: Date;
}

interface RecentInvoicesProps {
  invoices: RecentInvoice[];
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  PAID: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
  PARTIAL: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
  UNPAID: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500 animate-pulse" },
};

const methodIcons: Record<string, React.ElementType> = {
  CASH: Banknote,
  UPI: Smartphone,
  CARD: CreditCard,
  CREDIT: Clock,
};

export function RecentInvoices({ invoices }: RecentInvoicesProps) {
  if (invoices.length === 0) {
    return (
      <p className="text-sm text-[#4B4E53] text-center py-8">No invoices yet</p>
    );
  }

  return (
    <div className="space-y-1">
      {invoices.map((inv) => {
        const status = statusConfig[inv.paymentStatus] || statusConfig.PAID;
        const MethodIcon = methodIcons[inv.paymentMethod] || Banknote;

        return (
          <Link
            key={inv.id}
            href={`/billing/${inv.id}`}
            className="flex items-center gap-3 rounded-xl p-3 hover:bg-[#EDF2F4]/80 transition-all duration-200 group border border-transparent hover:border-[#E5EAF0]"
          >
            {/* Method Icon */}
            <div className="w-9 h-9 rounded-lg bg-[#EDF2F4] flex items-center justify-center shrink-0 group-hover:bg-[#E5EAF0] transition-colors">
              <MethodIcon className="w-4 h-4 text-[#4B4E53]" />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-[#1D1E27]">{inv.invoiceNumber}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                  inv.type === "GST"
                    ? "bg-[#C80018]/8 text-[#C80018]"
                    : "bg-[#EDF2F4] text-[#4B4E53]"
                }`}>
                  {inv.type === "GST" ? "GST" : "Cash"}
                </span>
              </div>
              <p className="text-[11px] text-[#4B4E53]/70 truncate">
                {inv.customerName || "Walk-in"} · {formatDate(inv.createdAt)}
              </p>
            </div>

            {/* Amount & Status */}
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-[#1D1E27]">{formatCurrency(inv.totalAmount)}</p>
              <div className={`inline-flex items-center gap-1 mt-0.5 ${status.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                <span className="text-[10px] font-semibold">{inv.paymentStatus}</span>
              </div>
            </div>

            {/* Arrow */}
            <ArrowUpRight className="w-4 h-4 text-[#4B4E53]/20 group-hover:text-[#4B4E53]/50 shrink-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        );
      })}
    </div>
  );
}
