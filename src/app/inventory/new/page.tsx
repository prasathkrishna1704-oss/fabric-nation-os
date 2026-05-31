import { PageHeader } from "@/components/layout/page-header";
import { ProductForm } from "@/components/inventory/product-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Add Product — Fabric Nation",
};

export default function NewProductPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <PageHeader title="Add New Fabric" description="Add a new fabric product to your inventory">
        <Link href="/inventory">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      </PageHeader>
      <ProductForm />
    </div>
  );
}
