import { prisma } from "@/lib/prisma";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewPurchasePage() {
  const [products, suppliers] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.supplier.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/inventory"
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Purchase Invoice</h1>
          <p className="text-muted-foreground text-sm">
            Record inward stock from suppliers
          </p>
        </div>
      </div>

      <PurchaseForm products={products} suppliers={suppliers} />
    </div>
  );
}
