import { getProduct } from "@/actions/inventory";
import { PageHeader } from "@/components/layout/page-header";
import { ProductForm } from "@/components/inventory/product-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export const metadata = { title: "Edit Product — Fabric Nation" };

interface Props { params: Promise<{ id: string }> }

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <div className="p-6 max-w-2xl mx-auto animate-fade-in">
      <PageHeader title="Edit Product" description={product.name}>
        <Link href="/inventory">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      </PageHeader>
      <ProductForm product={product} />
    </div>
  );
}
