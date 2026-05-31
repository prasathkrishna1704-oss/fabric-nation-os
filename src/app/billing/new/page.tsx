import { getProducts } from "@/actions/inventory";
import { getCustomers } from "@/actions/customers";
import { PageHeader } from "@/components/layout/page-header";
import { InvoiceForm } from "@/components/billing/invoice-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "New Invoice — Fabric Nation" };

export default async function NewInvoicePage() {
  const [products, customers] = await Promise.all([getProducts(), getCustomers()]);

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <PageHeader title="New Invoice" description="Create a GST or Non-GST invoice">
        <Link href="/billing">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      </PageHeader>
      <InvoiceForm products={products} customers={customers} />
    </div>
  );
}
