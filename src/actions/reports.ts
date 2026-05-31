"use server";

import { prisma } from "@/lib/prisma";

export interface ReportInvoice {
  id: string;
  invoiceNumber: string;
  type: string;
  customerName: string | null;
  customerGstin: string | null;
  subtotal: number;
  discountAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: Date;
  items: {
    productName: string;
    hsnCode: string | null;
    quantity: number;
    unit: string;
    rate: number;
    gstRate: number;
    cgst: number;
    sgst: number;
    igst: number;
    amount: number;
  }[];
}

export async function getReportData(period: "daily" | "weekly" | "monthly") {
  const now = new Date();
  let startDate: Date;

  if (period === "daily") {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "weekly") {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    include: {
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalSubtotal = invoices.reduce((sum, inv) => sum + inv.subtotal, 0);
  const totalCgst = invoices.reduce((sum, inv) => sum + inv.cgstAmount, 0);
  const totalSgst = invoices.reduce((sum, inv) => sum + inv.sgstAmount, 0);
  const totalIgst = invoices.reduce((sum, inv) => sum + inv.igstAmount, 0);
  const totalDiscount = invoices.reduce((sum, inv) => sum + inv.discountAmount, 0);

  const gstInvoices = invoices.filter((inv) => inv.type === "GST");
  const nonGstInvoices = invoices.filter((inv) => inv.type === "NON_GST");
  const paidInvoices = invoices.filter((inv) => inv.paymentStatus === "PAID");
  const unpaidInvoices = invoices.filter((inv) => inv.paymentStatus === "UNPAID");

  return {
    period,
    startDate,
    endDate: now,
    invoices: invoices as ReportInvoice[],
    summary: {
      totalInvoices: invoices.length,
      totalSales: Math.round(totalSales * 100) / 100,
      totalSubtotal: Math.round(totalSubtotal * 100) / 100,
      totalCgst: Math.round(totalCgst * 100) / 100,
      totalSgst: Math.round(totalSgst * 100) / 100,
      totalIgst: Math.round(totalIgst * 100) / 100,
      totalTax: Math.round((totalCgst + totalSgst + totalIgst) * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      gstInvoiceCount: gstInvoices.length,
      gstTotal: Math.round(gstInvoices.reduce((s, i) => s + i.totalAmount, 0) * 100) / 100,
      nonGstInvoiceCount: nonGstInvoices.length,
      nonGstTotal: Math.round(nonGstInvoices.reduce((s, i) => s + i.totalAmount, 0) * 100) / 100,
      paidCount: paidInvoices.length,
      paidTotal: Math.round(paidInvoices.reduce((s, i) => s + i.totalAmount, 0) * 100) / 100,
      unpaidCount: unpaidInvoices.length,
      unpaidTotal: Math.round(unpaidInvoices.reduce((s, i) => s + i.totalAmount, 0) * 100) / 100,
    },
  };
}
