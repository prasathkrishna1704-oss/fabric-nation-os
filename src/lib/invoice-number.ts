import { prisma } from "./prisma";

/**
 * Generate sequential invoice numbers
 * GST: INV-2026-001, INV-2026-002, ...
 * Non-GST: EST-2026-001, EST-2026-002, ...
 */
export async function generateInvoiceNumber(type: "GST" | "NON_GST"): Promise<string> {
  const prefix = type === "GST" ? "INV" : "EST";
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-%`;

  // Find the latest invoice number with this prefix
  const latest = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: `${prefix}-${year}-`,
      },
    },
    orderBy: {
      invoiceNumber: "desc",
    },
    select: {
      invoiceNumber: true,
    },
  });

  let nextNumber = 1;
  if (latest) {
    const parts = latest.invoiceNumber.split("-");
    const lastNumber = parseInt(parts[2], 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}-${year}-${String(nextNumber).padStart(3, "0")}`;
}
