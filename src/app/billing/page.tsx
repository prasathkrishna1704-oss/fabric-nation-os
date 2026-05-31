import { getInvoices } from "@/actions/billing";
import { getUserRole } from "@/actions/auth";
import { PageHeader } from "@/components/layout/page-header";
import { InvoiceTable } from "@/components/billing/invoice-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata = {
  title: "Billing — Fabric Nation",
  description: "Manage GST and non-GST invoices for your fabric store",
};

interface Props {
  searchParams: Promise<{ search?: string; type?: string; status?: string }>;
}

export default async function BillingPage({ searchParams }: Props) {
  const role = await getUserRole();
  const { search, type, status } = await searchParams;
  const invoices = await getInvoices({ search, type, paymentStatus: status });

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
      <PageHeader
        title="Billing"
        description={`${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}`}
      >
        <Link href="/billing/new">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        </Link>
      </PageHeader>
      <InvoiceTable invoices={invoices} role={role} />
    </div>
  );
}
