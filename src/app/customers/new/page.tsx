import { PageHeader } from "@/components/layout/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Add Customer — Fabric Nation" };

export default function NewCustomerPage() {
  return (
    <div className="p-6 max-w-xl mx-auto animate-fade-in">
      <PageHeader title="Add Customer" description="Register a new customer for invoicing">
        <Link href="/customers">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      </PageHeader>
      <CustomerForm />
    </div>
  );
}
