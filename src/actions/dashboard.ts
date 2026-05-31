"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Today's sales
  const todayInvoices = await prisma.invoice.findMany({
    where: {
      createdAt: { gte: startOfDay },
    },
  });

  const todaySales = todayInvoices.reduce(
    (sum, inv) => sum + inv.totalAmount,
    0
  );
  const todayCount = todayInvoices.length;

  // Monthly sales
  const monthInvoices = await prisma.invoice.findMany({
    where: {
      createdAt: { gte: startOfMonth },
    },
  });

  const monthlySales = monthInvoices.reduce(
    (sum, inv) => sum + inv.totalAmount,
    0
  );
  const monthlyCount = monthInvoices.length;

  // GST Liability (monthly)
  const gstInvoices = monthInvoices.filter((inv) => inv.type === "GST");
  const pendingGST = gstInvoices.reduce(
    (sum, inv) =>
      sum + inv.cgstAmount + inv.sgstAmount + inv.igstAmount,
    0
  );

  // Total stock value
  const products = await prisma.product.findMany({
    where: { isActive: true },
  });

  const totalStockValue = products.reduce(
    (sum, p) => sum + p.currentStock * p.sellingPrice,
    0
  );

  const totalStockUnits = products.reduce(
    (sum, p) => sum + p.currentStock,
    0
  );

  // Low stock alerts
  const lowStockProducts = products.filter(
    (p) => p.currentStock <= p.lowStockThreshold
  );

  // Recent invoices
  const recentInvoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      items: true,
    },
  });

  // Sales trend - last 7 days
  const salesTrend = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayInvoices = await prisma.invoice.findMany({
      where: {
        createdAt: { gte: dayStart, lt: dayEnd },
      },
    });

    const gstSales = dayInvoices
      .filter((inv) => inv.type === "GST")
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
    const nonGstSales = dayInvoices
      .filter((inv) => inv.type === "NON_GST")
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    salesTrend.push({
      date: dayStart.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      }),
      gst: Math.round(gstSales * 100) / 100,
      nonGst: Math.round(nonGstSales * 100) / 100,
      total: Math.round((gstSales + nonGstSales) * 100) / 100,
    });
  }

  // Top selling products (this month)
  const monthItems = await prisma.invoiceItem.findMany({
    where: {
      invoice: {
        createdAt: { gte: startOfMonth },
      },
    },
  });

  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  for (const item of monthItems) {
    if (!productSales[item.productId]) {
      productSales[item.productId] = {
        name: item.productName,
        qty: 0,
        revenue: 0,
      };
    }
    productSales[item.productId].qty += item.quantity;
    productSales[item.productId].revenue += item.amount;
  }

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    todaySales: Math.round(todaySales * 100) / 100,
    todayCount,
    monthlySales: Math.round(monthlySales * 100) / 100,
    monthlyCount,
    pendingGST: Math.round(pendingGST * 100) / 100,
    totalStockValue: Math.round(totalStockValue * 100) / 100,
    totalStockUnits: Math.round(totalStockUnits * 100) / 100,
    lowStockProducts,
    recentInvoices,
    salesTrend,
    topProducts,
    totalProducts: products.length,
  };
}
