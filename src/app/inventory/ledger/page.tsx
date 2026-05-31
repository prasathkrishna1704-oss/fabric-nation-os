import { getStockLedger } from "@/actions/inventory";
import { getProducts } from "@/actions/inventory";
import { PageHeader } from "@/components/layout/page-header";
import { StockLedgerTable } from "@/components/inventory/stock-ledger-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Stock Ledger — Fabric Nation" };

export default async function StockLedgerPage() {
  const [ledger, products] = await Promise.all([getStockLedger(), getProducts()]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
      <PageHeader title="Stock Ledger" description="Complete audit trail of all stock movements">
        <Link href="/inventory">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Inventory
          </Button>
        </Link>
      </PageHeader>
      <StockLedgerTable entries={ledger} />
    </div>
  );
}
