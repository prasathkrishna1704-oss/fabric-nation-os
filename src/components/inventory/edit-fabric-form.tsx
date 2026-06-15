"use client";

import { useState } from "react";
import { ProductForm } from "@/components/inventory/product-form";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@generated/prisma";
import { formatQuantity } from "@/lib/format";

export function EditFabricForm({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");

  const selectedProduct = products.find((p) => p.id === productId);

  return (
    <div className="space-y-6">
      <div className="premium-card rounded-[24px] p-8">
        <div className="space-y-2">
          <Label className="text-gray-700 font-bold">Select Fabric to Edit *</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              role="combobox"
              aria-expanded={open}
              className="inline-flex items-center justify-between whitespace-nowrap w-full h-12 bg-[#F9FAFB] border border-gray-200 rounded-xl focus:ring-[#C80018]/20 focus:border-[#C80018]/30 font-medium text-left px-3 hover:bg-gray-50"
            >
              {productId && selectedProduct ? (
                <span className="truncate">
                  {selectedProduct.name} {(selectedProduct.productCode || selectedProduct.color) ? `[${selectedProduct.productCode || ""}${selectedProduct.productCode && selectedProduct.color ? " - " : ""}${selectedProduct.color || ""}]` : ""}
                </span>
              ) : (
                <span className="text-gray-500 font-normal">Search fabric to edit...</span>
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
                          Current Price: ₹{p.sellingPrice} · Stock: {formatQuantity(p.currentStock, p.unit)}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {selectedProduct && (
        <div className="animate-slide-up">
          <ProductForm product={selectedProduct} key={selectedProduct.id} />
        </div>
      )}
    </div>
  );
}
