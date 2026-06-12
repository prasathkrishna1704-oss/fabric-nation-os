"use server";

import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber } from "@/lib/invoice-number";
import { calculateLineItemGST, SHOP_STATE_CODE } from "@/lib/gst-engine";
import { revalidatePath } from "next/cache";
import { getUserRole } from "@/actions/auth";

export interface InvoiceLineItem {
  productId: string;
  quantity: number;
  rate: number;
  gstRate: number;
}

export async function createInvoice(data: {
  type: "GST" | "NON_GST";
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerGstin?: string;
  customerStateCode?: string;
  billingAddress?: string;
  shippingAddress?: string;
  hsnCode?: string;
  items: InvoiceLineItem[];
  discountPercent: number;
  paymentMethod: string;
  paymentStatus: string;
  amountPaid: number;
  balanceAmount: number;
  notes?: string;
}) {
  const invoiceNumber = await generateInvoiceNumber(data.type);
  const isInterState =
    data.customerStateCode &&
    data.customerStateCode !== SHOP_STATE_CODE;

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
      if (product.currentStock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.currentStock}, Requested: ${item.quantity}`);
      }

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
        hsnCode: data.hsnCode || product.hsnCode,
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

  // Create invoice with items and deduct stock in a transaction
  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        invoiceNumber,
        type: data.type,
        customerId: data.customerId || null,
        customerName: data.customerName || null,
        customerPhone: data.customerPhone || null,
        customerGstin: data.customerGstin || null,
        billingAddress: data.billingAddress || null,
        shippingAddress: data.shippingAddress || null,
        subtotal,
        discountPercent: data.discountPercent,
        discountAmount,
        cgstAmount: totalCgst,
        sgstAmount: totalSgst,
        igstAmount: totalIgst,
        totalAmount,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        amountPaid: data.amountPaid,
        balanceAmount: data.balanceAmount,
        notes: data.notes || null,
        items: {
          create: lineItems,
        },
      },
      include: { items: true },
    });

    // Deduct stock for each item
    for (const item of lineItems) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) continue;

      const newBalance = product.currentStock - item.quantity;
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: newBalance },
      });
      await tx.stockLedger.create({
        data: {
          productId: item.productId,
          type: "OUTWARD",
          quantity: -item.quantity,
          referenceType: "INVOICE",
          referenceId: inv.id,
          notes: `Sold via Invoice ${invoiceNumber}`,
          balanceAfter: newBalance,
        },
      });
    }

    return inv;
  }, {
    maxWait: 5000,
    timeout: 20000,
  });

  revalidatePath("/", "layout");

  return invoice;
}

export async function updateInvoice(
  id: string,
  data: {
    type: "GST" | "NON_GST";
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerGstin?: string;
    customerStateCode?: string;
    billingAddress?: string;
    shippingAddress?: string;
    hsnCode?: string;
    items: InvoiceLineItem[];
    discountPercent: number;
    paymentMethod: string;
    paymentStatus: string;
    amountPaid: number;
    balanceAmount: number;
    notes?: string;
  }
) {
  const isInterState =
    data.customerStateCode &&
    data.customerStateCode !== SHOP_STATE_CODE;

  // Calculate line items first without hitting DB for stock checks
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const calculatedItems = data.items.map((item) => {
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
      quantity: item.quantity,
      rate: item.rate,
      gstRate: data.type === "GST" ? item.gstRate : 0,
      cgst: gstCalc.cgst,
      sgst: gstCalc.sgst,
      igst: gstCalc.igst,
      amount: gstCalc.totalWithTax,
    };
  });

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

  const invoice = await prisma.$transaction(async (tx) => {
    const existingInvoice = await tx.invoice.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existingInvoice) throw new Error("Invoice not found");

    // 1. Restore old stock
    for (const oldItem of existingInvoice.items) {
      const product = await tx.product.findUnique({ where: { id: oldItem.productId } });
      if (!product) continue;
      
      const restoredStock = product.currentStock + oldItem.quantity;
      await tx.product.update({
        where: { id: oldItem.productId },
        data: { currentStock: restoredStock },
      });
      await tx.stockLedger.create({
        data: {
          productId: oldItem.productId,
          type: "INWARD",
          quantity: oldItem.quantity,
          referenceType: "INVOICE_EDIT_REVERT",
          referenceId: id,
          notes: `Reverted for edit: Invoice ${existingInvoice.invoiceNumber}`,
          balanceAfter: restoredStock,
        },
      });
    }

    // 2. Delete old items
    await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

    // 3. Prepare new items with product details
    const newItemsData = [];
    for (const calcItem of calculatedItems) {
      const product = await tx.product.findUnique({ where: { id: calcItem.productId } });
      if (!product) throw new Error(`Product not found: ${calcItem.productId}`);
      
      if (product.currentStock < calcItem.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.currentStock}, Requested: ${calcItem.quantity}`);
      }

      newItemsData.push({
        productId: calcItem.productId,
        productName: product.name,
        hsnCode: data.hsnCode || product.hsnCode,
        unit: product.unit,
        quantity: calcItem.quantity,
        rate: calcItem.rate,
        gstRate: calcItem.gstRate,
        cgst: calcItem.cgst,
        sgst: calcItem.sgst,
        igst: calcItem.igst,
        amount: calcItem.amount,
      });

      // 4. Deduct new stock
      const newBalance = product.currentStock - calcItem.quantity;
      await tx.product.update({
        where: { id: calcItem.productId },
        data: { currentStock: newBalance },
      });
      await tx.stockLedger.create({
        data: {
          productId: calcItem.productId,
          type: "OUTWARD",
          quantity: -calcItem.quantity,
          referenceType: "INVOICE",
          referenceId: id,
          notes: `Edited Invoice ${existingInvoice.invoiceNumber}`,
          balanceAfter: newBalance,
        },
      });
    }

    // 5. Update invoice
    const updatedInv = await tx.invoice.update({
      where: { id },
      data: {
        type: data.type,
        customerId: data.customerId || null,
        customerName: data.customerName || null,
        customerPhone: data.customerPhone || null,
        customerGstin: data.customerGstin || null,
        billingAddress: data.billingAddress || null,
        shippingAddress: data.shippingAddress || null,
        subtotal,
        discountPercent: data.discountPercent,
        discountAmount,
        cgstAmount: totalCgst,
        sgstAmount: totalSgst,
        igstAmount: totalIgst,
        totalAmount,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        amountPaid: data.amountPaid,
        balanceAmount: data.balanceAmount,
        notes: data.notes || null,
        items: {
          create: newItemsData,
        },
      },
      include: { items: true },
    });

    return updatedInv.id;
  }, {
    maxWait: 5000,
    timeout: 20000,
  });

  try {
    revalidatePath("/", "layout");
  } catch (e) {
    console.error("Revalidation error:", e);
  }

  return { success: true, id };
}

export async function getInvoices(filters?: {
  search?: string;
  type?: string;
  paymentStatus?: string;
}) {
  const where: Record<string, unknown> = {};

  if (filters?.type && filters.type !== "all") {
    where.type = filters.type;
  }

  if (filters?.paymentStatus && filters.paymentStatus !== "all") {
    where.paymentStatus = filters.paymentStatus;
  }

  if (filters?.search) {
    where.OR = [
      { invoiceNumber: { contains: filters.search } },
      { customerName: { contains: filters.search } },
      { customerPhone: { contains: filters.search } },
    ];
  }

  return prisma.invoice.findMany({
    where,
    include: {
      items: true,
      customer: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoice(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: true },
      },
      customer: true,
    },
  });
}

export async function deleteInvoice(id: string) {
  const role = await getUserRole();
  if (role !== "admin") {
    throw new Error("Unauthorized: Only admins can delete invoices");
  }

  // Restore stock before deleting
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!invoice) throw new Error("Invoice not found");

  await prisma.$transaction(async (tx) => {
    // Restore stock for each item
    for (const item of invoice.items) {
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
          referenceType: "INVOICE",
          referenceId: id,
          notes: `Reversed from deleted Invoice ${invoice.invoiceNumber}`,
          balanceAfter: newBalance,
        },
      });
    }

    // Delete invoice (cascade deletes items)
    await tx.invoice.delete({ where: { id } });
  }, {
    maxWait: 5000,
    timeout: 15000,
  });

  revalidatePath("/billing");
  revalidatePath("/inventory");
  revalidatePath("/");
}
