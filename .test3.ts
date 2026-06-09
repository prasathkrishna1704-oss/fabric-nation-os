import "dotenv/config";
import { getInvoice } from "./src/actions/billing";
import { prisma } from "./src/lib/prisma";

async function main() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 1
  });
  
  if (!invoices.length) return console.log("No invoice");

  const id = invoices[0].id;
  const invoice = await getInvoice(id);
  console.log("Invoice ID:", invoice?.id);
  
  if (!invoice) return console.log("Invoice is null!");
  
  console.dir(invoice, { depth: null });
}

main().catch(console.error);
