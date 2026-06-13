"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getUserRole } from "@/actions/auth";

export async function getProducts(search?: string, category?: string) {
  const where: Record<string, unknown> = { isActive: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { hsnCode: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
      { productCode: { contains: search, mode: "insensitive" } },
      { color: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category && category !== "all") {
    where.category = category;
  }

  return prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
  });
}

export async function getProduct(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

export async function createProduct(data: {
  name: string;
  productCode?: string;
  hsnCode?: string;
  category?: string;
  fabricType?: string;
  color?: string;
  numberOfRolls?: number;
  gsm?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  gstRate: number;
  currentStock: number;
  lowStockThreshold: number;
  supplierInvoiceNumber?: string;
  supplierName?: string;
}) {
  const product = await prisma.product.create({
    data: {
      name: data.name,
      productCode: data.productCode || null,
      hsnCode: data.hsnCode || null,
      category: data.category || null,
      fabricType: data.fabricType || null,
      color: data.color || null,
      numberOfRolls: data.numberOfRolls || null,
      gsm: data.gsm || null,
      unit: data.unit,
      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice,
      gstRate: data.gstRate,
      currentStock: data.currentStock,
      lowStockThreshold: data.lowStockThreshold,
    },
  });

  // Create initial stock ledger entry if stock > 0
  if (data.currentStock > 0) {
    if (data.supplierInvoiceNumber) {
      // Create a Purchase Invoice for this initial stock
      const { generatePurchaseNumber } = await import("@/lib/purchase-number");
      const purchaseNumber = await generatePurchaseNumber();
      const amount = data.currentStock * data.costPrice;
      const gstAmount = amount * (data.gstRate / 100);
      const totalAmount = amount + gstAmount;

      const pur = await prisma.purchase.create({
        data: {
          purchaseNumber,
          type: data.gstRate > 0 ? "GST" : "NON_GST",
          supplierInvoiceNumber: data.supplierInvoiceNumber,
          supplierName: data.supplierName,
          subtotal: amount,
          cgstAmount: gstAmount / 2,
          sgstAmount: gstAmount / 2,
          totalAmount: totalAmount,
          paymentStatus: "UNPAID",
          items: {
            create: [{
              productId: product.id,
              productName: product.name,
              hsnCode: product.hsnCode,
              unit: product.unit,
              quantity: data.currentStock,
              rate: data.costPrice,
              gstRate: data.gstRate,
              cgst: gstAmount / 2,
              sgst: gstAmount / 2,
              amount: totalAmount,
            }],
          },
        },
      });

      await prisma.stockLedger.create({
        data: {
          productId: product.id,
          type: "INWARD",
          quantity: data.currentStock,
          referenceType: "PURCHASE",
          referenceId: pur.id,
          notes: `Initial stock from Invoice ${data.supplierInvoiceNumber}`,
          balanceAfter: data.currentStock,
        },
      });
    } else {
      await prisma.stockLedger.create({
        data: {
          productId: product.id,
          type: "INWARD",
          quantity: data.currentStock,
          referenceType: "MANUAL",
          notes: "Initial stock entry",
          balanceAfter: data.currentStock,
        },
      });
    }
  }

  revalidatePath("/inventory");
  return product;
}

export async function updateProduct(
  id: string,
  data: {
    name: string;
    productCode?: string;
    hsnCode?: string;
    category?: string;
    fabricType?: string;
    color?: string;
    numberOfRolls?: number;
    gsm?: string;
    unit: string;
    costPrice: number;
    sellingPrice: number;
    gstRate: number;
    lowStockThreshold: number;
  }
) {
  const product = await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      productCode: data.productCode || null,
      hsnCode: data.hsnCode || null,
      category: data.category || null,
      fabricType: data.fabricType || null,
      color: data.color || null,
      numberOfRolls: data.numberOfRolls || null,
      gsm: data.gsm || null,
      unit: data.unit,
      costPrice: data.costPrice,
      sellingPrice: data.sellingPrice,
      gstRate: data.gstRate,
      lowStockThreshold: data.lowStockThreshold,
    },
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  return product;
}

export async function deleteProduct(id: string) {
  const role = await getUserRole();
  if (role !== "admin") {
    throw new Error("Unauthorized: Only admins can deactivate products");
  }
  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
  revalidatePath("/inventory");
}

export async function inwardStock(data: {
  productId: string;
  quantity: number;
  notes?: string;
  supplierInvoiceNumber?: string;
  supplierName?: string;
}) {
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
  });

  if (!product) throw new Error("Product not found");

  const newBalance = product.currentStock + data.quantity;

  if (data.supplierInvoiceNumber) {
    const { generatePurchaseNumber } = await import("@/lib/purchase-number");
    const purchaseNumber = await generatePurchaseNumber();
    const amount = data.quantity * product.costPrice;
    const gstAmount = amount * (product.gstRate / 100);
    const totalAmount = amount + gstAmount;

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: data.productId },
        data: { currentStock: newBalance },
      });

      const pur = await tx.purchase.create({
        data: {
          purchaseNumber,
          type: product.gstRate > 0 ? "GST" : "NON_GST",
          supplierInvoiceNumber: data.supplierInvoiceNumber,
          supplierName: data.supplierName,
          subtotal: amount,
          cgstAmount: gstAmount / 2,
          sgstAmount: gstAmount / 2,
          totalAmount: totalAmount,
          paymentStatus: "UNPAID",
          items: {
            create: [{
              productId: product.id,
              productName: product.name,
              hsnCode: product.hsnCode,
              unit: product.unit,
              quantity: data.quantity,
              rate: product.costPrice,
              gstRate: product.gstRate,
              cgst: gstAmount / 2,
              sgst: gstAmount / 2,
              amount: totalAmount,
            }],
          },
        },
      });

      await tx.stockLedger.create({
        data: {
          productId: data.productId,
          type: "INWARD",
          quantity: data.quantity,
          referenceType: "PURCHASE",
          referenceId: pur.id,
          notes: data.notes || `Stock inwarding from Invoice ${data.supplierInvoiceNumber}`,
          balanceAfter: newBalance,
        },
      });
    });
  } else {
    await prisma.$transaction([
      prisma.product.update({
        where: { id: data.productId },
        data: { currentStock: newBalance },
      }),
      prisma.stockLedger.create({
        data: {
          productId: data.productId,
          type: "INWARD",
          quantity: data.quantity,
          referenceType: "MANUAL",
          notes: data.notes || "Stock inwarding",
          balanceAfter: newBalance,
        },
      }),
    ]);
  }

  revalidatePath("/inventory");
  revalidatePath("/stock/inward");
  revalidatePath("/");
}

export async function adjustStock(data: {
  productId: string;
  quantity: number;
  notes: string;
}) {
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
  });

  if (!product) throw new Error("Product not found");

  const newBalance = product.currentStock + data.quantity;

  await prisma.$transaction([
    prisma.product.update({
      where: { id: data.productId },
      data: { currentStock: newBalance },
    }),
    prisma.stockLedger.create({
      data: {
        productId: data.productId,
        type: "ADJUSTMENT",
        quantity: data.quantity,
        referenceType: "MANUAL",
        notes: data.notes,
        balanceAfter: newBalance,
      },
    }),
  ]);

  revalidatePath("/inventory");
}

export async function replaceStock(data: {
  productId: string;
  newQuantity: number;
  notes?: string;
}) {
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
  });

  if (!product) throw new Error("Product not found");

  const diff = data.newQuantity - product.currentStock;
  const type = diff >= 0 ? "INWARD" : "OUTWARD";

  await prisma.$transaction([
    prisma.product.update({
      where: { id: data.productId },
      data: { currentStock: data.newQuantity },
    }),
    prisma.stockLedger.create({
      data: {
        productId: data.productId,
        type,
        quantity: Math.abs(diff),
        referenceType: "MANUAL",
        notes: data.notes || "Stock manually replaced/overwritten",
        balanceAfter: data.newQuantity,
      },
    }),
  ]);

  revalidatePath("/inventory");
  revalidatePath("/stock/inward");
  revalidatePath("/");
}

export async function getStockLedger(productId?: string) {
  const where: Record<string, unknown> = {};
  if (productId) {
    where.productId = productId;
  }

  return prisma.stockLedger.findMany({
    where,
    include: { product: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
  });
  return products.filter((p) => p.currentStock <= p.lowStockThreshold);
}
