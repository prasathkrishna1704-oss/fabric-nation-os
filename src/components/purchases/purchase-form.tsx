"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPurchase } from "@/actions/purchase";
import { calculateLineItemGST, SHOP_STATE_CODE } from "@/lib/gst-engine";
import { formatCurrency, PAYMENT_METHODS, UNIT_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, FileText, Receipt, ScanBarcode } from "lucide-react";
import type { Product, Supplier } from "@generated/prisma";

interface LineItem {
  productId: string;
  quantity: string;
  rate: string;
  gstRate: number;
}

interface PurchaseFormProps {
  products: Product[];
  suppliers: Supplier[];
}

export function PurchaseForm({ products, suppliers }: PurchaseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isGST, setIsGST] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierGstin, setSupplierGstin] = useState("");
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [supplierStateCode, setSupplierStateCode] = useState(SHOP_STATE_CODE);
  const [billingAddress, setBillingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentStatus, setPaymentStatus] = useState("PAID");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scannerInput, setScannerInput] = useState("");
  const [lines, setLines] = useState<LineItem[]>([
    { productId: "", quantity: "", rate: "", gstRate: 5 },
  ]);

  const handleSupplierSelect = (id: string | null) => {
    setSupplierId(id ?? "");
    const s = suppliers.find((s) => s.id === id);
    if (s) {
      setSupplierName(s.name);
      setSupplierPhone(s.phone || "");
      setSupplierGstin(s.gstin || "");
      setSupplierStateCode(s.stateCode || SHOP_STATE_CODE);
      const fullAddress = [s.address, s.city, s.pincode].filter(Boolean).join(", ");
      setBillingAddress(fullAddress);
    }
  };

  const addLine = () =>
    setLines((ls) => [...ls, { productId: "", quantity: "", rate: "", gstRate: 5 }]);

  const removeLine = (i: number) =>
    setLines((ls) => ls.filter((_, idx) => idx !== i));

  const updateLine = (i: number, patch: Partial<LineItem>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

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
            rate: p.costPrice?.toString() ?? "0", // Default to cost price for purchase
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

  const isInterState = supplierStateCode && supplierStateCode !== SHOP_STATE_CODE;
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

    startTransition(async () => {
      try {
        const purchase = await createPurchase({
          type: isGST ? "GST" : "NON_GST",
          supplierId: supplierId || undefined,
          supplierName: supplierName || undefined,
          supplierPhone: supplierPhone || undefined,
          supplierGstin: supplierGstin || undefined,
          supplierInvoiceNumber: supplierInvoiceNumber || undefined,
          supplierStateCode: supplierStateCode || undefined,
          billingAddress: billingAddress || undefined,
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
        // We'll redirect to inventory or a purchase list
        router.push(`/inventory`);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-semibold">Purchase Type</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isGST ? "GST Purchase Invoice — Includes CGST/SGST/IGST calculations" : "Non-GST Purchase"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm ${!isGST ? "text-foreground font-medium" : "text-muted-foreground"}`}>Non-GST</span>
            <Switch id="gst-toggle" checked={isGST} onCheckedChange={setIsGST} />
            <span className={`text-sm ${isGST ? "text-primary font-medium" : "text-muted-foreground"}`}>GST Purchase</span>
          </div>
        </div>
        {isGST && isInterState && (
          <div className="mt-3 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-xs text-primary">
            ⚡ Inter-state supply — IGST will be applied instead of CGST+SGST
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Supplier Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="supplier-select">Existing Supplier (optional)</Label>
            <Select value={supplierId} onValueChange={handleSupplierSelect}>
              <SelectTrigger id="supplier-select" className="h-10 w-full">
                <SelectValue placeholder="Select supplier..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} {s.phone ? `· ${s.phone}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supplier-name">Supplier Name</Label>
            <Input id="supplier-name" placeholder="e.g. ABC Textiles" className="h-10" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supplier-phone">Phone</Label>
            <Input id="supplier-phone" placeholder="9876543210" className="h-10" value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="billing-address">Billing Address</Label>
            <Textarea id="billing-address" placeholder="Enter billing address" rows={2} value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supplier-invoice">Supplier Invoice Number</Label>
            <Input id="supplier-invoice" placeholder="e.g. INV-12345" className="h-10" value={supplierInvoiceNumber} onChange={(e) => setSupplierInvoiceNumber(e.target.value)} />
          </div>
          {isGST && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="supplier-gstin">Supplier GSTIN</Label>
                <Input id="supplier-gstin" placeholder="22AAAAA0000A1Z5" value={supplierGstin} onChange={(e) => setSupplierGstin(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state-code">State Code</Label>
                <Input id="state-code" placeholder="e.g. 33 for Tamil Nadu" value={supplierStateCode} onChange={(e) => setSupplierStateCode(e.target.value)} />
                <p className="text-[11px] text-muted-foreground">Shop state: {SHOP_STATE_CODE}</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Items</h2>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" onClick={(e) => {
              e.preventDefault();
              window.open("/inventory/update", "_blank");
            }}>
              <Plus className="w-3.5 h-3.5" /> New Product
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addLine}>
              <Plus className="w-3.5 h-3.5" /> Add Row
            </Button>
          </div>
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
                <Input className="h-9 text-sm" type="number" step="0.01" min="0.01" placeholder="0"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
            <Label htmlFor="purchase-notes">Notes</Label>
            <Textarea id="purchase-notes" placeholder="Any additional notes..." rows={2}
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

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
              {isPending ? "Creating..." : isGST ? "Create GST Purchase" : "Create Non-GST Purchase"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
