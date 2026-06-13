"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inwardStock, replaceStock } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { formatQuantity, UNIT_LABELS } from "@/lib/format";
import { Loader2, ArrowDownToLine, PackagePlus, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@generated/prisma";

interface StockInwardFormProps {
  products: Product[];
}

export function StockInwardForm({ products }: StockInwardFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [updateMode, setUpdateMode] = useState<"ADD" | "REPLACE">("ADD");
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
      if (updateMode === "ADD") {
        await inwardStock({
          productId,
          quantity: parseFloat(quantity),
          supplierInvoiceNumber: supplierInvoiceNumber || undefined,
          supplierName: supplierName || undefined,
          notes: notes || undefined,
        });
        setSuccess(`Successfully added ${formatQuantity(parseFloat(quantity), selected?.unit ?? "METER")} to ${selected?.name}`);
      } else {
        await replaceStock({
          productId,
          newQuantity: parseFloat(quantity),
          notes: notes || undefined,
        });
        setSuccess(`Successfully set total stock to ${formatQuantity(parseFloat(quantity), selected?.unit ?? "METER")} for ${selected?.name}`);
      }
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
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              role="combobox"
              aria-expanded={open}
              className="inline-flex items-center justify-between whitespace-nowrap w-full h-12 bg-[#F9FAFB] border border-gray-200 rounded-xl focus:ring-[#C80018]/20 focus:border-[#C80018]/30 font-medium text-left px-3 hover:bg-gray-50"
            >
              {productId && selected ? (
                <span className="truncate">
                  {selected.name} {(selected.productCode || selected.color) ? `[${selected.productCode || ""}${selected.productCode && selected.color ? " - " : ""}${selected.color || ""}]` : ""}
                </span>
              ) : (
                <span className="text-gray-500 font-normal">Search fabric name or code...</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl shadow-xl border-gray-100 max-h-[400px]">
              <Command>
                <CommandInput placeholder="Search fabrics..." className="h-11" />
                <CommandList className="max-h-[300px]">
                  <CommandEmpty>No fabric found.</CommandEmpty>
                  <CommandGroup>
                    {products.map((p) => (
                      <CommandItem
                        key={p.id}
                        value={`${p.name} ${p.productCode || ""} ${p.color || ""} ${p.hsnCode || ""} ${p.category || ""}`}
                        onSelect={() => {
                          setProductId(p.id);
                          setOpen(false);
                        }}
                        className="py-3 cursor-pointer flex flex-col items-start gap-1"
                      >
                        <div className="flex items-center w-full">
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 text-[#C80018]",
                              productId === p.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="font-bold text-gray-900">{p.name}</span>
                          {(p.productCode || p.color) && (
                            <span className="text-gray-500 ml-2 text-xs font-medium">
                              [{p.productCode || ""}{p.productCode && p.color ? " - " : ""}{p.color || ""}]
                            </span>
                          )}
                        </div>
                        <div className="pl-6 text-gray-400 text-xs font-semibold">
                          Stock: {formatQuantity(p.currentStock, p.unit)} · Category: {p.category || "—"}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {selected && (
          <div className="rounded-xl bg-[#F5F7F9] p-4 text-sm space-y-1.5 border border-gray-100 flex justify-between items-center animate-fade-in">
            <div>
              <p className="text-gray-500 font-medium">Category: <span className="text-gray-900 font-bold">{selected.category}</span></p>
              <p className="text-gray-500 font-medium text-xs mt-0.5">HSN: <span className="font-mono text-gray-700">{selected.hsnCode || "—"}</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium mb-0.5">Current Total Weight / Stock</p>
              <div className="bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-100 inline-block">
                <span className="text-[#1D1E27] font-black text-base">{formatQuantity(selected.currentStock, selected.unit)}</span>
              </div>
            </div>
          </div>
        )}

        {selected && (
          <div className="flex bg-gray-100/50 p-1.5 rounded-xl border border-gray-200/50 w-full md:w-96">
            <button
              type="button"
              onClick={() => setUpdateMode("ADD")}
              className={`flex-1 text-sm font-bold py-2.5 rounded-lg transition-all ${
                updateMode === "ADD" 
                  ? "bg-white text-[#C80018] shadow-sm border border-gray-200" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Add to Stock
            </button>
            <button
              type="button"
              onClick={() => setUpdateMode("REPLACE")}
              className={`flex-1 text-sm font-bold py-2.5 rounded-lg transition-all ${
                updateMode === "REPLACE" 
                  ? "bg-white text-[#C80018] shadow-sm border border-gray-200" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Overwrite Total Weight
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-gray-700 font-bold">
              {updateMode === "ADD" ? "Amount to Add" : "New Total Weight"} ({selected ? UNIT_LABELS[selected.unit] || selected.unit : "Units"}) *
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

        {updateMode === "REPLACE" && (
          <div className="rounded-xl bg-orange-50 border border-orange-200 p-4 animate-fade-in">
            <p className="text-sm text-orange-800 font-medium">
              <strong className="font-bold">Warning:</strong> You are about to directly overwrite the total stock / weight for this fabric. This will reset the stock entirely to the new value you provide instead of adding to it.
            </p>
          </div>
        )}

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
          {isPending ? "Recording..." : updateMode === "ADD" ? "Record Stock Inward" : "Confirm Weight Overwrite"}
        </button>
      </div>
    </form>
  );
}
