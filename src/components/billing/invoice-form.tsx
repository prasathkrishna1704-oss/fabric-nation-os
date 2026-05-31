"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInvoice } from "@/actions/billing";
import { calculateLineItemGST, SHOP_STATE_CODE } from "@/lib/gst-engine";
import { formatCurrency, PAYMENT_METHODS, UNIT_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, FileText, Receipt, ScanBarcode } from "lucide-react";
import type { Product, Customer } from "@generated/prisma";

interface LineItem {
  productId: string;
  quantity: string;
  rate: string;
  gstRate: number;
}

interface InvoiceFormProps {
  products: Product[];
  customers: Customer[];
}

export function InvoiceForm({ products, customers }: InvoiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isGST, setIsGST] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [customerStateCode, setCustomerStateCode] = useState(SHOP_STATE_CODE);
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentStatus, setPaymentStatus] = useState("PAID");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scannerInput, setScannerInput] = useState("");
  const [lines, setLines] = useState<LineItem[]>([
    { productId: "", quantity: "", rate: "", gstRate: 5 },
  ]);

  // When a known customer is selected, autofill fields
  const handleCustomerSelect = (id: string | null) => {
    setCustomerId(id ?? "");
    const c = customers.find((c) => c.id === id);
    if (c) {
      setCustomerName(c.name);
      setCustomerPhone(c.phone || "");
      setCustomerGstin(c.gstin || "");
      setCustomerStateCode(c.stateCode || SHOP_STATE_CODE);
      
      const fullAddress = [c.address, c.city, c.pincode].filter(Boolean).join(", ");
      setBillingAddress(fullAddress);
      setShippingAddress(fullAddress);
    }
  };

  const addLine = () =>
    setLines((ls) => [...ls, { productId: "", quantity: "", rate: "", gstRate: 5 }]);

  const removeLine = (i: number) =>
    setLines((ls) => ls.filter((_, idx) => idx !== i));

  const updateLine = (i: number, patch: Partial<LineItem>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  // When product is selected on a line, auto-fill rate and gstRate
  const handleProductSelect = (i: number, productId: string | null) => {
    const p = products.find((p) => p.id === productId);
    updateLine(i, {
      productId: productId ?? "",
      rate: p?.sellingPrice?.toString() ?? "",
      gstRate: p?.gstRate ?? 5,
    });
  };

  const handleScannerKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = scannerInput.trim();
      if (!query) return;

      const p = products.find((prod) => prod.id === query);
      if (p) {
        setLines(ls => {
          const lastLine = ls[ls.length - 1];
          const newLine = {
            productId: p.id,
            quantity: "1",
            rate: p.sellingPrice?.toString() ?? "",
            gstRate: p.gstRate ?? 5
          };

          if (lastLine && !lastLine.productId && !lastLine.quantity) {
            return [...ls.slice(0, -1), newLine];
          }
          return [...ls, newLine];
        });
        setScannerInput("");
        setError(null);
      } else {
        setError(`QR Code / Product ID not found: ${query}`);
      }
    }
  };

  // Live totals calculation
  const isInterState = customerStateCode && customerStateCode !== SHOP_STATE_CODE;
  let subtotal = 0, totalCGST = 0, totalSGST = 0, totalIGST = 0;

  const lineCalcs = lines.map((l) => {
    const qty = parseFloat(l.quantity) || 0;
    const rate = parseFloat(l.rate) || 0;
    if (!qty || !rate) return null;
    const calc = calculateLineItemGST({
      quantity: qty, rate,
      gstRate: isGST ? l.gstRate : 0,
      isInterState: !!isInterState,
    });
    subtotal += calc.subtotal;
    totalCGST += calc.cgst;
    totalSGST += calc.sgst;
    totalIGST += calc.igst;
    return calc;
  });

  const discountAmt = Math.round(subtotal * (parseFloat(discountPercent) / 100) * 100) / 100;
  const discountedSubtotal = subtotal - discountAmt;
  const ratio = subtotal > 0 ? discountedSubtotal / subtotal : 1;
  const adjCGST = Math.round(totalCGST * ratio * 100) / 100;
  const adjSGST = Math.round(totalSGST * ratio * 100) / 100;
  const adjIGST = Math.round(totalIGST * ratio * 100) / 100;
  const totalAmount = Math.round((discountedSubtotal + adjCGST + adjSGST + adjIGST) * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validLines = lines.filter((l) => l.productId && parseFloat(l.quantity) > 0 && parseFloat(l.rate) > 0);
    if (!validLines.length) return;

    // Check stock
    for (const l of validLines) {
      const p = products.find((p) => p.id === l.productId);
      if (p && parseFloat(l.quantity) > p.currentStock) {
        setError(`Insufficient stock for ${p.name}. Available: ${p.currentStock}`);
        return;
      }
    }

    startTransition(async () => {
      try {
        const invoice = await createInvoice({
          type: isGST ? "GST" : "NON_GST",
          customerId: customerId || undefined,
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          customerGstin: customerGstin || undefined,
          customerStateCode: customerStateCode || undefined,
          billingAddress: billingAddress || undefined,
          shippingAddress: shippingAddress || undefined,
          hsnCode: hsnCode || undefined,
          items: validLines.map((l) => ({
            productId: l.productId,
            quantity: parseFloat(l.quantity),
            rate: parseFloat(l.rate),
            gstRate: l.gstRate,
          })),
          discountPercent: parseFloat(discountPercent) || 0,
          paymentMethod,
          paymentStatus,
          notes: notes || undefined,
        });
        router.push(`/billing/${invoice.id}`);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Invoice Type Toggle */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-semibold">Invoice Type</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isGST ? "GST Tax Invoice — Includes CGST/SGST/IGST calculations" : "Cash Bill / Estimate — No tax calculations"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm ${!isGST ? "text-foreground font-medium" : "text-muted-foreground"}`}>Cash Bill</span>
            <Switch id="gst-toggle" checked={isGST} onCheckedChange={setIsGST} />
            <span className={`text-sm ${isGST ? "text-primary font-medium" : "text-muted-foreground"}`}>GST Invoice</span>
          </div>
        </div>
        {isGST && isInterState && (
          <div className="mt-3 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-xs text-primary">
            ⚡ Inter-state supply — IGST will be applied instead of CGST+SGST
          </div>
        )}
      </div>

      {/* Customer Details */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Customer Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="customer-select">Existing Customer (optional)</Label>
            <Select value={customerId} onValueChange={handleCustomerSelect}>
              <SelectTrigger id="customer-select" className="h-10 w-full">
                <SelectValue placeholder="Select or type walk-in customer..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} {c.phone ? `· ${c.phone}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hsn-code">HSN Code</Label>
            <Input id="hsn-code" placeholder="e.g. 5208" className="h-10" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} />
            <p className="text-[11px] text-muted-foreground">Applied to all items in this invoice</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer-name">Customer Name</Label>
            <Input id="customer-name" placeholder="e.g. Rajesh Kumar" className="h-10" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer-phone">Phone</Label>
            <Input id="customer-phone" placeholder="9876543210" className="h-10" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="billing-address">Billing Address</Label>
            <Textarea id="billing-address" placeholder="Enter billing address" rows={2} value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shipping-address">Shipping Address</Label>
            <Textarea id="shipping-address" placeholder="Enter shipping address" rows={2} value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} />
          </div>
          {isGST && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="customer-gstin">Customer GSTIN</Label>
                <Input id="customer-gstin" placeholder="22AAAAA0000A1Z5" value={customerGstin} onChange={(e) => setCustomerGstin(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state-code">State Code</Label>
                <Input id="state-code" placeholder="e.g. 33 for Tamil Nadu" value={customerStateCode} onChange={(e) => setCustomerStateCode(e.target.value)} />
                <p className="text-[11px] text-muted-foreground">Shop state: {SHOP_STATE_CODE}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Items</h2>
          <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addLine}>
            <Plus className="w-3.5 h-3.5" /> Add Row
          </Button>
        </div>

        <div className="relative mb-2">
          <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="scanner-input"
            placeholder="Scan Fabric QR Code or enter Product ID... (Press Enter)"
            className="pl-9 bg-muted/20 focus-visible:bg-background border-primary/20 focus-visible:border-primary/50 transition-colors"
            value={scannerInput}
            onChange={(e) => setScannerInput(e.target.value)}
            onKeyDown={handleScannerKey}
          />
        </div>

        {/* Header */}
        <div className="grid gap-2 text-xs text-muted-foreground font-medium px-1"
          style={{ gridTemplateColumns: "1fr 90px 90px" + (isGST ? " 70px" : "") + " 100px 36px" }}>
          <span>Product</span><span>Qty</span><span>Rate (₹)</span>
          {isGST && <span>GST%</span>}
          <span className="text-right">Amount</span>
          <span></span>
        </div>

        <div className="space-y-2">
          {lines.map((line, i) => {
            const calc = lineCalcs[i];
            const product = products.find((p) => p.id === line.productId);
            return (
              <div key={i} className="grid gap-2 items-center"
                style={{ gridTemplateColumns: "1fr 90px 90px" + (isGST ? " 70px" : "") + " 100px 36px" }}>
                <div className="h-9 px-3 flex items-center border border-border/50 rounded-md bg-muted/20 text-sm truncate text-foreground font-medium">
                  {line.productId ? products.find((p) => p.id === line.productId)?.name : "Scan to add fabric..."}
                </div>
                <Input className="h-9 text-sm" type="number" step="0.01" min="0.01" max={product?.currentStock} placeholder="0"
                  value={line.quantity} onChange={(e) => updateLine(i, { quantity: e.target.value })} />
                <Input className="h-9 text-sm" type="number" step="0.01" min="0" placeholder="0"
                  value={line.rate} onChange={(e) => updateLine(i, { rate: e.target.value })} />
                {isGST && (
                  <Select value={line.gstRate.toString()} onValueChange={(v) => updateLine(i, { gstRate: parseFloat(v ?? "5") })}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0, 5, 12, 18, 28].map((r) => <SelectItem key={r} value={r.toString()}>{r}%</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <div className="text-right text-sm font-semibold text-foreground">
                  {calc ? formatCurrency(calc.totalWithTax) : "—"}
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-red-400"
                  onClick={() => removeLine(i)} disabled={lines.length === 1}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Totals & Payment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Payment */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Payment</h2>
          <div className="space-y-2">
            <Label>Method</Label>
            <div className="flex bg-muted/40 p-1 rounded-lg border border-border/50">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  className={cn(
                    "flex-1 text-xs font-semibold py-2 rounded-md transition-all",
                    paymentMethod === m.value
                      ? "bg-background shadow-sm text-foreground border border-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex bg-muted/40 p-1 rounded-lg border border-border/50">
              {[
                { value: "PAID", label: "Paid", color: "text-emerald-500" },
                { value: "PARTIAL", label: "Partial", color: "text-amber-500" },
                { value: "UNPAID", label: "Unpaid / Credit", color: "text-destructive" },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setPaymentStatus(s.value)}
                  className={cn(
                    "flex-1 text-xs font-semibold py-2 rounded-md transition-all flex items-center justify-center gap-1.5",
                    paymentStatus === s.value
                      ? "bg-background shadow-sm text-foreground border border-border/50"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {paymentStatus === s.value && <div className={cn("w-1.5 h-1.5 rounded-full bg-current", s.color)} />}
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="discount">Discount (%)</Label>
            <Input id="discount" type="number" min="0" max="100" step="0.5" placeholder="0"
              value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invoice-notes">Notes</Label>
            <Textarea id="invoice-notes" placeholder="Any additional notes..." rows={2}
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            {parseFloat(discountPercent) > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>Discount ({discountPercent}%)</span><span>− {formatCurrency(discountAmt)}</span>
              </div>
            )}
            {isGST && !isInterState && adjCGST > 0 && (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>CGST</span><span>{formatCurrency(adjCGST)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>SGST</span><span>{formatCurrency(adjSGST)}</span>
                </div>
              </>
            )}
            {isGST && isInterState && adjIGST > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>IGST</span><span>{formatCurrency(adjIGST)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold text-foreground">
              <span>Total</span><span className="text-primary">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="pt-2">
            {error && <div className="text-sm font-medium text-destructive mb-3">{error}</div>}
            <Button type="submit" className="w-full gap-2" disabled={isPending || !lines.some((l) => l.productId && l.quantity && l.rate)}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : isGST ? <Receipt className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              {isPending ? "Creating..." : isGST ? "Create GST Invoice" : "Create Cash Bill"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
