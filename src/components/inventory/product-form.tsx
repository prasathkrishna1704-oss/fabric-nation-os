"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/actions/inventory";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UNIT_OPTIONS } from "@/lib/format";
import { GST_RATES } from "@/lib/gst-engine";
import { Loader2, Save, X } from "lucide-react";
import type { Product } from "@generated/prisma";

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name: product?.name ?? "",
    productCode: product?.productCode ?? "",
    hsnCode: product?.hsnCode ?? "",
    category: product?.category ?? "",
    fabricType: product?.fabricType ?? "",
    color: product?.color ?? "",
    numberOfRolls: product?.numberOfRolls?.toString() ?? "",
    gsm: product?.gsm ?? "",
    unit: product?.unit ?? "METER",
    costPrice: product?.costPrice?.toString() ?? "",
    sellingPrice: product?.sellingPrice?.toString() ?? "",
    gstRate: product?.gstRate?.toString() ?? "5",
    currentStock: product?.currentStock?.toString() ?? "0",
    lowStockThreshold: product?.lowStockThreshold?.toString() ?? "5",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const data = {
        name: form.name,
        productCode: form.productCode || undefined,
        hsnCode: form.hsnCode || undefined,
        category: form.category || undefined,
        fabricType: form.fabricType || undefined,
        color: form.color || undefined,
        numberOfRolls: form.numberOfRolls ? parseInt(form.numberOfRolls) : undefined,
        gsm: form.gsm || undefined,
        unit: form.unit,
        costPrice: parseFloat(form.costPrice) || 0,
        sellingPrice: parseFloat(form.sellingPrice) || 0,
        gstRate: parseFloat(form.gstRate) || 5,
        currentStock: parseFloat(form.currentStock) || 0,
        lowStockThreshold: parseFloat(form.lowStockThreshold) || 5,
      };
      if (product) {
        const { currentStock, ...updateData } = data;
        await updateProduct(product.id, updateData);
      } else {
        await createProduct(data);
      }
      window.location.href = "/inventory";
    });
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const inputClass = "h-12 bg-[#F9FAFB] border-gray-200 rounded-xl focus-visible:ring-[#C80018]/20 focus-visible:border-[#C80018]/30 font-medium";
  const labelClass = "text-gray-700 font-bold text-sm mb-1.5 block";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in pb-12">
      <div className="premium-card rounded-[24px] p-8 space-y-7">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="w-1.5 h-6 rounded-full bg-[#C80018]"></div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight">Product Details</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="name" className={labelClass}>Product Name *</Label>
            <Input id="name" placeholder="e.g. Pure Cotton White" required {...field("name")} className={`${inputClass} font-bold text-lg`} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hsnCode" className={labelClass}>HSN Code</Label>
            <Input id="hsnCode" placeholder="e.g. 5208" {...field("hsnCode")} className={inputClass} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productCode" className={labelClass}>Product Code</Label>
            <Input id="productCode" placeholder="e.g. CTN-WHT-001" {...field("productCode")} className={inputClass} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color" className={labelClass}>Fabric Colour</Label>
            <Input id="color" placeholder="e.g. Royal Blue" {...field("color")} className={inputClass} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gsm" className={labelClass}>GSM (Weight)</Label>
            <Input id="gsm" placeholder="e.g. 150 GSM" {...field("gsm")} className={inputClass} />
          </div>

          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="numberOfRolls" className={labelClass}>Number of Rolls</Label>
              <Input id="numberOfRolls" type="number" min="0" placeholder="e.g. 10" {...field("numberOfRolls")} className={inputClass} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit" className={labelClass}>Unit of Measure *</Label>
              <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v ?? "METER" }))}>
                <SelectTrigger id="unit" className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {UNIT_OPTIONS.map((u) => (
                    <SelectItem key={u.value} value={u.value} className="py-3 font-medium cursor-pointer">{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstRate" className={labelClass}>GST Rate (%)</Label>
              <Select value={form.gstRate} onValueChange={(v) => setForm((f) => ({ ...f, gstRate: v ?? "5" }))}>
                <SelectTrigger id="gstRate" className={inputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {GST_RATES.map((r) => (
                    <SelectItem key={r} value={r.toString()} className="py-3 font-medium cursor-pointer">{r}% GST</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="premium-card rounded-[24px] p-8 space-y-7">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="w-1.5 h-6 rounded-full bg-emerald-500"></div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight">Pricing</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="costPrice" className={labelClass}>Cost Price (₹ / {form.unit === "METER" ? "Mtr" : form.unit === "KILOGRAM" ? "Kg" : form.unit})</Label>
            <Input id="costPrice" type="number" step="0.01" min="0" placeholder="0.00" {...field("costPrice")} className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sellingPrice" className={labelClass}>Selling Price (₹ / {form.unit === "METER" ? "Mtr" : form.unit === "KILOGRAM" ? "Kg" : form.unit}) *</Label>
            <Input id="sellingPrice" type="number" step="0.01" min="0" placeholder="0.00" required {...field("sellingPrice")} className={`${inputClass} font-bold text-lg text-emerald-700`} />
          </div>
        </div>
      </div>

      <div className="premium-card rounded-[24px] p-8 space-y-7">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="w-1.5 h-6 rounded-full bg-blue-500"></div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight">Stock Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 flex flex-col">
            <Label htmlFor="currentStock" className={labelClass}>Opening Stock</Label>
            <Input id="currentStock" type="number" step="0.01" min="0" placeholder="0" {...field("currentStock")} className={inputClass} disabled={!!product} />
            <p className="text-[11px] font-medium text-gray-400 mt-auto pt-1">
              {product ? "Cannot change opening stock while editing" : "Fractional quantities allowed (e.g. 2.5)"}
            </p>
          </div>

          <div className="space-y-2 flex flex-col">
            <Label htmlFor="lowStockThreshold" className={labelClass}>Low Stock Alert Threshold</Label>
            <Input id="lowStockThreshold" type="number" step="0.01" min="0" placeholder="5" {...field("lowStockThreshold")} className={inputClass} />
            {!product && <p className="text-[11px] font-medium text-transparent mt-auto pt-1 select-none">Placeholder</p>}
          </div>


        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => window.location.href = "/inventory"}
          className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 font-bold rounded-xl px-6 py-3.5 transition-all active:scale-[0.98]"
        >
          <X className="w-5 h-5" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 bg-[#C80018] hover:bg-[#A00010] text-white font-bold rounded-xl px-8 py-3.5 shadow-[0_8px_20px_rgba(200,0,24,0.25)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isPending ? "Saving..." : (product ? "Update Product" : "Add Product")}
        </button>
      </div>
    </form>
  );
}
