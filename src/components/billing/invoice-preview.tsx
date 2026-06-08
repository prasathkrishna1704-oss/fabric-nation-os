"use client";

import { formatCurrency, formatDate, formatQuantity } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import type { Invoice, InvoiceItem, Product, Customer } from "@generated/prisma";

type FullInvoice = Invoice & {
  items: (InvoiceItem & { product: Product })[];
  customer: Customer | null;
};

interface InvoicePreviewProps {
  invoice: FullInvoice;
}

const statusStyles: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
  UNPAID: "bg-red-50 text-red-700 border-red-200",
};

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = 'Rupees ' + convert(rupees);
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
  return result + ' Only';
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const isGST = invoice.type === "GST";
  const hasIGST = invoice.igstAmount > 0;

  // Calculate per-item taxable value (qty × rate)
  const itemsWithTaxable = invoice.items.map(item => ({
    ...item,
    taxableValue: item.quantity * item.rate,
  }));

  // Determine effective GST rate from items (for the summary line)
  const effectiveGstRate = invoice.items[0]?.gstRate || 5;
  const halfRate = effectiveGstRate / 2; // 2.5% for CGST and SGST

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="no-print flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
          <Printer className="w-4 h-4" /> Print Invoice
        </Button>
        <Badge variant="outline" className={statusStyles[invoice.paymentStatus]}>
          {invoice.paymentStatus}
        </Badge>
        <Badge variant="outline" className={isGST ? "bg-[#C80018]/5 text-[#C80018] border-[#C80018]/20" : "bg-[#EDF2F4] text-[#4B4E53]"}>
          {isGST ? "Tax Invoice" : "Cash Bill"}
        </Badge>
      </div>

      {/* A4 Invoice Paper */}
      <div className="bg-white border border-[#D8DEE4] shadow-sm mx-auto print-bg-white"
        style={{ width: "210mm", minHeight: "297mm", padding: "12mm 15mm" }}
        id="invoice-print-area"
      >
        {/* ─── Company Header ─── */}
        <div className="text-center border-b-2 border-[#1D1E27] pb-4 mb-4 flex flex-col items-center">
          <div className="w-12 h-12 mb-2">
            <Logo className="w-full h-full" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1D1E27] uppercase">
            <span className="text-[#C80018]">Fabric</span> Nation
          </h1>
          <p className="text-xs text-[#4B4E53] mt-1">No.46 Rice mill compound, Alangadu, Karuvampalayam, Tirupur,Tamil Nadu - 641604</p>
          <p className="text-xs text-[#4B4E53]">Ph: 9876543210 · Email: info@fabricnation.com</p>
          <div className="mt-3 inline-block border border-[#1D1E27] px-6 py-1">
            <p className="text-sm font-bold text-[#1D1E27] tracking-wider uppercase">
              {isGST ? "Tax Invoice" : "Cash Memo / Estimate"}
            </p>
          </div>
        </div>

        {/* ─── Invoice Meta ─── */}
        <div className="grid grid-cols-2 gap-4 text-xs mb-4">
          <div className="space-y-1">
            <div className="flex gap-2">
              <span className="font-bold text-[#1D1E27] w-24">Invoice No.</span>
              <span className="text-[#1D1E27]">: {invoice.invoiceNumber}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-[#1D1E27] w-24">Date</span>
              <span className="text-[#1D1E27]">: {formatDate(invoice.createdAt)}</span>
            </div>
            {isGST && (
              <div className="flex gap-2">
                <span className="font-bold text-[#1D1E27] w-24">GSTIN</span>
                <span className="text-[#1D1E27] font-mono">: 33BCMPV5075R1ZK</span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="font-bold text-[#1D1E27] w-24">Payment</span>
              <span className="text-[#1D1E27]">: {invoice.paymentMethod}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex gap-2">
              <span className="font-bold text-[#1D1E27] w-24">Status</span>
              <span className="text-[#1D1E27]">: {invoice.paymentStatus}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-[#1D1E27] w-24">State</span>
              <span className="text-[#1D1E27]">: Tamil Nadu (33)</span>
            </div>
          </div>
        </div>

        {/* ─── Billing Address ─── */}
        <div className="grid grid-cols-2 gap-4 border border-[#D8DEE4] mb-4">
          <div className="p-3 border-r border-[#D8DEE4]">
            <p className="text-[10px] font-bold text-[#4B4E53] uppercase tracking-wider mb-1">Billing Address</p>
            <p className="text-xs font-semibold text-[#1D1E27]">{invoice.customerName || "Walk-in Customer"}</p>
            {invoice.customerPhone && <p className="text-xs text-[#4B4E53]">Ph: {invoice.customerPhone}</p>}
            {invoice.customerGstin && <p className="text-xs text-[#4B4E53] font-mono">GSTIN: {invoice.customerGstin}</p>}
            {invoice.customer?.address && <p className="text-xs text-[#4B4E53]">{invoice.customer.address}</p>}
            {invoice.customer?.city && (
              <p className="text-xs text-[#4B4E53]">
                {invoice.customer.city}{invoice.customer.stateCode ? ` — State Code: ${invoice.customer.stateCode}` : ""}
                {invoice.customer.pincode ? ` — ${invoice.customer.pincode}` : ""}
              </p>
            )}
          </div>
          <div className="p-3">
            <p className="text-[10px] font-bold text-[#4B4E53] uppercase tracking-wider mb-1">Shipping Address</p>
            <p className="text-xs text-[#4B4E53] italic">Same as billing address</p>
          </div>
        </div>

        {/* ─── Items Table ─── */}
        <table className="w-full text-xs border-collapse border border-[#D8DEE4] mb-4">
          <thead>
            <tr className="bg-[#EDF2F4]">
              <th className="border border-[#D8DEE4] px-2 py-2 text-left font-bold text-[#1D1E27] w-10">S.No.</th>
              <th className="border border-[#D8DEE4] px-2 py-2 text-left font-bold text-[#1D1E27]">Description of Goods</th>
              <th className="border border-[#D8DEE4] px-2 py-2 text-center font-bold text-[#1D1E27] w-16">HSN/SAC</th>
              <th className="border border-[#D8DEE4] px-2 py-2 text-center font-bold text-[#1D1E27] w-20">Quantity</th>
              <th className="border border-[#D8DEE4] px-2 py-2 text-center font-bold text-[#1D1E27] w-14">Unit</th>
              <th className="border border-[#D8DEE4] px-2 py-2 text-right font-bold text-[#1D1E27] w-20">Rate</th>
              <th className="border border-[#D8DEE4] px-2 py-2 text-right font-bold text-[#1D1E27] w-24">Amount (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            {itemsWithTaxable.map((item, i) => (
              <tr key={item.id}>
                <td className="border border-[#D8DEE4] px-2 py-2.5 text-center text-[#4B4E53]">{i + 1}</td>
                <td className="border border-[#D8DEE4] px-2 py-2.5 font-medium text-[#1D1E27]">{item.productName}</td>
                <td className="border border-[#D8DEE4] px-2 py-2.5 text-center font-mono text-[#4B4E53]">{item.hsnCode || "—"}</td>
                <td className="border border-[#D8DEE4] px-2 py-2.5 text-center text-[#1D1E27]">{item.quantity}</td>
                <td className="border border-[#D8DEE4] px-2 py-2.5 text-center text-[#4B4E53]">{item.unit}</td>
                <td className="border border-[#D8DEE4] px-2 py-2.5 text-right text-[#1D1E27]">{formatCurrency(item.rate)}</td>
                <td className="border border-[#D8DEE4] px-2 py-2.5 text-right font-semibold text-[#1D1E27]">{formatCurrency(item.taxableValue)}</td>
              </tr>
            ))}
            {/* Empty rows to fill space */}
            {Array.from({ length: Math.max(0, 5 - invoice.items.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border border-[#D8DEE4] px-2 py-2.5">&nbsp;</td>
                <td className="border border-[#D8DEE4] px-2 py-2.5"></td>
                <td className="border border-[#D8DEE4] px-2 py-2.5"></td>
                <td className="border border-[#D8DEE4] px-2 py-2.5"></td>
                <td className="border border-[#D8DEE4] px-2 py-2.5"></td>
                <td className="border border-[#D8DEE4] px-2 py-2.5"></td>
                <td className="border border-[#D8DEE4] px-2 py-2.5"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ─── Totals Section ─── */}
        <div className="flex justify-end mb-4">
          <table className="text-xs border-collapse border border-[#D8DEE4] w-80">
            <tbody>
              <tr>
                <td className="border border-[#D8DEE4] px-3 py-1.5 text-right font-medium text-[#4B4E53]" colSpan={2}>Total</td>
                <td className="border border-[#D8DEE4] px-3 py-1.5 text-right font-semibold text-[#1D1E27] w-28">{formatCurrency(invoice.subtotal)}</td>
              </tr>
              {invoice.discountAmount > 0 && (
                <tr>
                  <td className="border border-[#D8DEE4] px-3 py-1.5 text-right text-[#4B4E53]" colSpan={2}>
                    Discount ({invoice.discountPercent}%)
                  </td>
                  <td className="border border-[#D8DEE4] px-3 py-1.5 text-right text-red-600 w-28">
                    − {formatCurrency(invoice.discountAmount)}
                  </td>
                </tr>
              )}
              {invoice.discountAmount > 0 && (
                <tr className="bg-[#EDF2F4]">
                  <td className="border border-[#D8DEE4] px-3 py-1.5 text-right font-bold text-[#1D1E27]" colSpan={2}>Grand Total</td>
                  <td className="border border-[#D8DEE4] px-3 py-1.5 text-right font-bold text-[#1D1E27] w-28">
                    {formatCurrency(invoice.subtotal - invoice.discountAmount)}
                  </td>
                </tr>
              )}
              {isGST && !hasIGST && invoice.sgstAmount > 0 && (
                <>
                  <tr>
                    <td className="border border-[#D8DEE4] px-3 py-1.5 text-right text-[#4B4E53]" colSpan={2}>
                      Add:- SGST @ {halfRate}%
                    </td>
                    <td className="border border-[#D8DEE4] px-3 py-1.5 text-right text-[#1D1E27] w-28">{formatCurrency(invoice.sgstAmount)}</td>
                  </tr>
                  <tr>
                    <td className="border border-[#D8DEE4] px-3 py-1.5 text-right text-[#4B4E53]" colSpan={2}>
                      Add:- CGST @ {halfRate}%
                    </td>
                    <td className="border border-[#D8DEE4] px-3 py-1.5 text-right text-[#1D1E27] w-28">{formatCurrency(invoice.cgstAmount)}</td>
                  </tr>
                </>
              )}
              {isGST && hasIGST && (
                <tr>
                  <td className="border border-[#D8DEE4] px-3 py-1.5 text-right text-[#4B4E53]" colSpan={2}>
                    Add:- IGST @ {effectiveGstRate}%
                  </td>
                  <td className="border border-[#D8DEE4] px-3 py-1.5 text-right text-[#1D1E27] w-28">{formatCurrency(invoice.igstAmount)}</td>
                </tr>
              )}
              <tr className="bg-[#EDF2F4]">
                <td className="border border-[#D8DEE4] px-3 py-2 text-right font-black text-[#1D1E27]" colSpan={2}>
                  Grand Total (Including Tax)
                </td>
                <td className="border border-[#D8DEE4] px-3 py-2 text-right font-black text-[#C80018] text-sm w-28">
                  {formatCurrency(invoice.totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ─── Amount in Words & Bank Details ─── */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-[#D8DEE4] p-2.5 bg-[#FAFBFC] flex flex-col justify-center">
            <p className="text-xs text-[#1D1E27]">
              <span className="font-bold">Rupees :</span>{" "}
              <span className="italic">{numberToWords(invoice.totalAmount)}</span>
            </p>
          </div>
          <div className="border border-[#D8DEE4] p-2.5 bg-[#FAFBFC]">
            <p className="font-bold text-[#1D1E27] text-xs mb-1 underline">Bank Details :</p>
            <div className="grid grid-cols-[60px_1fr] gap-x-2 gap-y-0.5 mt-1">
              <span className="text-[10px] font-medium text-[#1D1E27]">Bank Name</span>
              <span className="text-[10px] text-[#4B4E53]">: HDFC Bank</span>
              <span className="text-[10px] font-medium text-[#1D1E27]">A/c No.</span>
              <span className="text-[10px] font-bold text-[#1D1E27]">: 50200012345678</span>
              <span className="text-[10px] font-medium text-[#1D1E27]">IFSC Code</span>
              <span className="text-[10px] text-[#4B4E53]">: HDFC0001234</span>
              <span className="text-[10px] font-medium text-[#1D1E27]">Branch</span>
              <span className="text-[10px] text-[#4B4E53]">: Tirupur</span>
            </div>
          </div>
        </div>

        {/* ─── Terms & Signature ─── */}
        <div className="grid grid-cols-2 gap-6 text-[10px] text-[#4B4E53] mb-4">
          <div>
            <p className="font-bold text-[#1D1E27] text-xs mb-2 underline">Terms & Conditions :</p>
            <ol className="list-decimal list-inside space-y-1 leading-relaxed">
              <li>Any complaint regarding rates will not be entertained if not lodged within one week of receipt of this bill.</li>
              <li>Any complaint regarding quality must be made within 3 days of receipt of the goods.</li>
              <li>Bills not paid on presentation will be subject to interest @ 24% per annum.</li>
              <li>All disputes subject to Tirupur jurisdiction.</li>
            </ol>
          </div>
          <div className="text-right flex flex-col justify-between">
            <p className="font-bold text-[#1D1E27] text-xs">For Fabric Nation</p>
            <div className="mt-12">
              <div className="border-t border-[#1D1E27] inline-block px-4 pt-1">
                <p className="font-bold text-[#1D1E27] text-xs">Authorised Signatory</p>
              </div>
            </div>
          </div>
        </div>

        {/* E.&.O.E. */}
        <div className="text-left">
          <p className="text-[10px] font-bold text-[#4B4E53]">E.&O.E.</p>
        </div>

        {/* Computer Generated */}
        <div className="text-center border-t border-[#D8DEE4] pt-2 mt-4">
          <p className="text-[10px] text-[#4B4E53] italic">Computer Generated Invoice</p>
        </div>
      </div>
    </div>
  );
}
