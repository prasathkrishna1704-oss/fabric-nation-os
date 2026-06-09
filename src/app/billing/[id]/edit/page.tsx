import { getInvoice } from "@/actions/billing";
import { prisma } from "@/lib/prisma";
import { InvoiceForm } from "@/components/billing/invoice-form";
import { PageHeader } from "@/components/layout/page-header";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Invoice — Fabric Nation",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: Props) {
  const { id } = await params;
  
  const [invoice, products, customers] = await Promise.all([
    getInvoice(id),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  if (!invoice) notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <PageHeader 
          title={`Edit ${invoice.invoiceNumber}`} 
          description="Update details and modify line items" 
        />
      </div>
      <InvoiceForm 
        products={products} 
        customers={customers} 
        initialData={invoice} 
      />
    </div>
  );
}
