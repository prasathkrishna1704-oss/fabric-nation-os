"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inwardStock } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatQuantity, UNIT_LABELS } from "@/lib/format";
import { Loader2, ArrowDownToLine, PackagePlus } from "lucide-react";
import type { Product } from "@generated/prisma";

interface StockInwardFormProps {
  products: Product[];
}

export function StockInwardForm({ products }: StockInwardFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const selected = products.find((p) => p.id === productId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity) return;
    startTransition(async () => {
      await inwardStock({
        productId,
        quantity: parseFloat(quantity),
        supplierInvoiceNumber: supplierInvoiceNumber || undefined,
        supplierName: supplierName || undefined,
        notes: notes || undefined,
      });
      setSuccess(`Successfully added ${formatQuantity(parseFloat(quantity), selected?.unit ?? "METER")} of ${selected?.name}`);
      setProductId("");
      setQuantity("");
      setSupplierName("");
      setSupplierInvoiceNumber("");
      setNotes("");
      router.refresh();
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-5 py-4 flex items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <PackagePlus className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-sm font-bold text-emerald-700">{success}</p>
        </div>
      )}

      <div className="premium-card rounded-[24px] p-8 space-y-7">
        <div className="space-y-2">
          <Label htmlFor="product-select" className="text-gray-700 font-bold">Select Fabric *</Label>
          <Select value={productId} onValueChange={(v) => setProductId(v ?? "")} required>
            <SelectTrigger id="product-select" className="h-12 bg-[#F9FAFB] border-gray-200 rounded-xl focus:ring-[#C80018]/20 focus:border-[#C80018]/30 font-medium">
              <SelectValue placeholder="Choose a fabric product...">
                {productId ? products.find((p) => p.id === productId)?.name : "Choose a fabric product..."}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="min-w-[400px] rounded-xl shadow-xl border-gray-100">
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id} className="py-3 cursor-pointer">
                  <span className="font-bold text-gray-900">{p.name}</span>
                  <span className="text-gray-400 ml-2 text-xs font-semibold">
                    (Current Stock: {formatQuantity(p.currentStock, p.unit)})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selected && (
          <div className="rounded-xl bg-[#F5F7F9] p-4 text-sm space-y-1.5 border border-gray-100 flex justify-between items-center animate-fade-in">
            <div>
              <p className="text-gray-500 font-medium">Category: <span className="text-gray-900 font-bold">{selected.category}</span></p>
              <p className="text-gray-500 font-medium text-xs mt-0.5">HSN: <span className="font-mono text-gray-700">{selected.hsnCode || "—"}</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium mb-0.5">Current Stock</p>
              <div className="bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-100 inline-block">
                <span className="text-[#1D1E27] font-black text-base">{formatQuantity(selected.currentStock, selected.unit)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-gray-700 font-bold">
              Quantity ({selected ? UNIT_LABELS[selected.unit] || selected.unit : "Units"}) *
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 50.5"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="h-12 bg-[#F9FAFB] border-gray-200 rounded-xl focus-visible:ring-[#C80018]/20 focus-visible:border-[#C80018]/30 font-bold text-lg"
            />
            <p className="text-[11px] font-medium text-gray-400">Fractional quantities allowed (e.g. 10.5)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplierName-inward" className="text-gray-700 font-bold">Supplier Name</Label>
            <Input
              id="supplierName-inward"
              placeholder="e.g. Acme Fabrics"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="h-12 bg-[#F9FAFB] border-gray-200 rounded-xl focus-visible:ring-[#C80018]/20 focus-visible:border-[#C80018]/30 font-medium"
            />
            <p className="text-[11px] font-medium text-gray-400">Optional. Name of the supplier.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier-invoice-inward" className="text-gray-700 font-bold">Invoice Number</Label>
            <Input
              id="supplier-invoice-inward"
              placeholder="e.g. INV-2026"
              value={supplierInvoiceNumber}
              onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
              className="h-12 bg-[#F9FAFB] border-gray-200 rounded-xl focus-visible:ring-[#C80018]/20 focus-visible:border-[#C80018]/30 font-medium"
            />
            <p className="text-[11px] font-medium text-gray-400">Optional. Creates a Purchase Invoice if provided.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inward-notes" className="text-gray-700 font-bold">Notes</Label>
          <Textarea
            id="inward-notes"
            placeholder="e.g. Received from Supplier X, Batch #123"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="bg-[#F9FAFB] border-gray-200 rounded-xl focus-visible:ring-[#C80018]/20 focus-visible:border-[#C80018]/30 font-medium resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button 
          type="submit" 
          disabled={isPending || !productId || !quantity} 
          className="inline-flex items-center justify-center gap-2 bg-[#C80018] hover:bg-[#A00010] text-white font-bold rounded-xl px-8 py-3.5 shadow-[0_8px_20px_rgba(200,0,24,0.25)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowDownToLine className="w-5 h-5" />}
          {isPending ? "Recording..." : "Record Stock Inward"}
        </button>
      </div>
    </form>
  );
}
