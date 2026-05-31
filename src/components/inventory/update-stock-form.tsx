"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductForm } from "@/components/inventory/product-form";
import { StockInwardForm } from "@/components/inventory/stock-inward-form";
import type { Product } from "@generated/prisma";
import { ArrowDownToLine, PlusCircle } from "lucide-react";

interface UpdateStockFormProps {
  products: Product[];
}

export function UpdateStockForm({ products }: UpdateStockFormProps) {
  return (
    <Tabs defaultValue="existing" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-10 h-14 bg-[#EDF2F4] p-1.5 rounded-2xl border border-gray-200/50 shadow-inner">
        <TabsTrigger 
          value="existing" 
          className="rounded-xl h-full data-[state=active]:bg-white data-[state=active]:text-[#C80018] data-[state=active]:shadow-md font-bold text-gray-500 transition-all flex items-center justify-center gap-2"
        >
          <ArrowDownToLine className="w-4 h-4" />
          Update Existing Fabric
        </TabsTrigger>
        <TabsTrigger 
          value="new" 
          className="rounded-xl h-full data-[state=active]:bg-white data-[state=active]:text-[#C80018] data-[state=active]:shadow-md font-bold text-gray-500 transition-all flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Add New Fabric
        </TabsTrigger>
      </TabsList>
      <div className="animate-slide-up">
        <TabsContent value="existing" className="mt-0 outline-none">
          <StockInwardForm products={products} />
        </TabsContent>
        <TabsContent value="new" className="mt-0 outline-none">
          <ProductForm />
        </TabsContent>
      </div>
    </Tabs>
  );
}
