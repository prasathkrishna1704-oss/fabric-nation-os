import { getProducts } from "@/actions/inventory";
import { PageHeader } from "@/components/layout/page-header";
import { StockInwardForm } from "@/components/inventory/stock-inward-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Stock Inward — Fabric Nation" };

export default async function StockInwardPage() {
  const products = await getProducts();
  return (
    <div className="p-6 max-w-xl mx-auto animate-fade-in">
      <PageHeader title="Stock Inward" description="Record new fabric stock received from supplier">
        <Link href="/inventory">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      </PageHeader>
      <StockInwardForm products={products} />
    </div>
  );
}
