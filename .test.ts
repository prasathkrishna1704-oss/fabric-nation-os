import "dotenv/config";
import { updateInvoice, getInvoice } from "./src/actions/billing";
import { prisma } from "./src/lib/prisma";

async function main() {
  const inv = await prisma.invoice.findFirst({ include: { items: true }});
  if (!inv) return console.log("No invoice");

  console.log("Found invoice:", inv.id);
  
  const payload = {
    type: inv.type as "GST" | "NON_GST",
    customerId: inv.customerId || undefined,
    items: inv.items.map(i => ({
      productId: i.productId,
      quantity: i.quantity,
      rate: i.rate,
      gstRate: i.gstRate
    })),
    discountPercent: inv.discountPercent,
    paymentMethod: inv.paymentMethod,
    paymentStatus: inv.paymentStatus
  };

  const updated = await updateInvoice(inv.id, payload);
  console.log("Updated:", updated.id);
}
main().catch(console.error);
