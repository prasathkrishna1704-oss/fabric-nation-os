import { getCustomers } from "@/actions/customers";
import { PageHeader } from "@/components/layout/page-header";
import { CustomerTable } from "@/components/customers/customer-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata = { title: "Customers — Fabric Nation" };

export default async function CustomersPage() {
  const customers = await getCustomers();
  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
      <PageHeader title="Customers" description={`${customers.length} registered customers`}>
        <Link href="/customers/new">
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </Link>
      </PageHeader>
      <CustomerTable customers={customers} />
    </div>
  );
}
