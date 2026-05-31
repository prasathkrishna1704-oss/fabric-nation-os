import { prisma } from "@/lib/prisma";

export async function generatePurchaseNumber() {
  const currentYear = new Date().getFullYear();
  const prefix = `PUR-${currentYear}-`;

  const lastPurchase = await prisma.purchase.findFirst({
    where: { purchaseNumber: { startsWith: prefix } },
    orderBy: { purchaseNumber: "desc" },
    select: { purchaseNumber: true },
  });

  if (!lastPurchase) {
    return `${prefix}001`;
  }

  const lastNumber = parseInt(lastPurchase.purchaseNumber.replace(prefix, ""), 10);
  const nextNumber = lastNumber + 1;
  return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
}
