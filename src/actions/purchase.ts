"use server";

import { prisma } from "@/lib/prisma";
import { generatePurchaseNumber } from "@/lib/purchase-number";
import { calculateLineItemGST, SHOP_STATE_CODE } from "@/lib/gst-engine";
import { revalidatePath } from "next/cache";

export interface PurchaseLineItem {
  productId: string;
  quantity: number;
  rate: number;
  gstRate: number;
}

export async function createPurchase(data: {
  type: "GST" | "NON_GST";
  supplierId?: string;
  supplierName?: string;
  supplierPhone?: string;
  supplierGstin?: string;
  supplierInvoiceNumber?: string;
  supplierStateCode?: string;
  billingAddress?: string;
  items: PurchaseLineItem[];
  discountPercent: number;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
}) {
  const purchaseNumber = await generatePurchaseNumber();
  const isInterState =
    data.supplierStateCode &&
    data.supplierStateCode !== SHOP_STATE_CODE;

  // Calculate line items
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const lineItems = await Promise.all(
    data.items.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) throw new Error(`Product not found: ${item.productId}`);

      const gstCalc = calculateLineItemGST({
        quantity: item.quantity,
        rate: item.rate,
        gstRate: data.type === "GST" ? item.gstRate : 0,
        isInterState: !!isInterState,
      });

      subtotal += gstCalc.subtotal;
      totalCgst += gstCalc.cgst;
      totalSgst += gstCalc.sgst;
      totalIgst += gstCalc.igst;

      return {
        productId: item.productId,
        productName: product.name,
        hsnCode: product.hsnCode,
        unit: product.unit,
        quantity: item.quantity,
        rate: item.rate,
        gstRate: data.type === "GST" ? item.gstRate : 0,
        cgst: gstCalc.cgst,
        sgst: gstCalc.sgst,
        igst: gstCalc.igst,
        amount: gstCalc.totalWithTax,
      };
    })
  );

  // Apply discount
  const discountAmount = Math.round(subtotal * (data.discountPercent / 100) * 100) / 100;
  const discountedSubtotal = subtotal - discountAmount;

  // Adjust taxes for discount
  if (data.discountPercent > 0 && subtotal > 0) {
    const ratio = discountedSubtotal / subtotal;
    totalCgst = Math.round(totalCgst * ratio * 100) / 100;
    totalSgst = Math.round(totalSgst * ratio * 100) / 100;
    totalIgst = Math.round(totalIgst * ratio * 100) / 100;
  }

  const totalAmount = Math.round((discountedSubtotal + totalCgst + totalSgst + totalIgst) * 100) / 100;

  // Create purchase with items and ADD stock in a transaction
  const purchase = await prisma.$transaction(async (tx) => {
    const pur = await tx.purchase.create({
      data: {
        purchaseNumber,
        type: data.type,
        supplierId: data.supplierId || null,
        supplierName: data.supplierName || null,
        supplierPhone: data.supplierPhone || null,
        supplierGstin: data.supplierGstin || null,
        supplierInvoiceNumber: data.supplierInvoiceNumber || null,
        billingAddress: data.billingAddress || null,
        subtotal,
        discountPercent: data.discountPercent,
        discountAmount,
        cgstAmount: totalCgst,
        sgstAmount: totalSgst,
        igstAmount: totalIgst,
        totalAmount,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        notes: data.notes || null,
        items: {
          create: lineItems,
        },
      },
      include: { items: true },
    });

    // ADD stock for each item (Inward)
    for (const item of lineItems) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) continue;

      const newBalance = product.currentStock + item.quantity;
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: newBalance },
      });
      await tx.stockLedger.create({
        data: {
          productId: item.productId,
          type: "INWARD",
          quantity: item.quantity,
          referenceType: "PURCHASE",
          referenceId: pur.id,
          notes: `Purchased via ${purchaseNumber}`,
          balanceAfter: newBalance,
        },
      });
    }

    return pur;
  });

  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/");

  return purchase;
}
