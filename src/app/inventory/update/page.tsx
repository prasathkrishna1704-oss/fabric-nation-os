import { getProducts } from "@/actions/inventory";
import { PageHeader } from "@/components/layout/page-header";
import { UpdateStockForm } from "@/components/inventory/update-stock-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Update Stock — Fabric Nation",
};

export default async function UpdateStockPage() {
  const products = await getProducts();

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <PageHeader title="Update Stock" description="Add new fabric or update stock for existing fabric">
        <Link href="/inventory">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      </PageHeader>
      <UpdateStockForm products={products} />
    </div>
  );
}
