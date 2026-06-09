import { getInvoice } from "@/actions/billing";
import { PageHeader } from "@/components/layout/page-header";
import { InvoicePreview } from "@/components/billing/invoice-preview";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  return { title: invoice ? `${invoice.invoiceNumber} — Fabric Nation` : "Invoice — Fabric Nation" };
}

interface Props { params: Promise<{ id: string }> }

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="no-print mb-6">
        <PageHeader title={invoice.invoiceNumber} description={invoice.type === "GST" ? "Tax Invoice" : "Cash Bill / Estimate"}>
          <div className="flex items-center gap-2">
            <Link href={`/billing/${id}/edit`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </Link>
            <Link href="/billing">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
          </div>
        </PageHeader>
      </div>
      <InvoicePreview invoice={invoice} />
    </div>
  );
}
