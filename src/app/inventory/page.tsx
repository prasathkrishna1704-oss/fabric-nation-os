import { getProducts, getLowStockProducts } from "@/actions/inventory";
import { getUserRole } from "@/actions/auth";
import { PageHeader } from "@/components/layout/page-header";
import { ProductTable } from "@/components/inventory/product-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata = {
  title: "Inventory — Fabric Nation",
  description: "Manage fabric products, track stock levels, and monitor inventory",
};

interface Props {
  searchParams: Promise<{ search?: string; category?: string }>;
}

export default async function InventoryPage({ searchParams }: Props) {
  const role = await getUserRole();
  const { search, category } = await searchParams;
  const [products, lowStock] = await Promise.all([
    getProducts(search, category),
    getLowStockProducts(),
  ]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
      <PageHeader
        title="Inventory"
        description={`${products.length} products · ${lowStock.length} low stock`}
      >
        <div className="flex items-center gap-3">
          <Link href="/inventory/update">
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Update Stock
            </Button>
          </Link>
        </div>
      </PageHeader>
      <ProductTable products={products} role={role} />
    </div>
  );
}
