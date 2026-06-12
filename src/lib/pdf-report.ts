"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportSummary {
  totalInvoices: number;
  totalSales: number;
  totalSubtotal: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  totalDiscount: number;
  gstInvoiceCount: number;
  gstTotal: number;
  nonGstInvoiceCount: number;
  nonGstTotal: number;
  paidCount: number;
  paidTotal: number;
  unpaidCount: number;
  unpaidTotal: number;
}

interface ReportInvoice {
  invoiceNumber: string;
  type: string;
  customerName: string | null;
  customerGstin: string | null;
  subtotal: number;
  discountAmount: number;
  sgstAmount: number;
  cgstAmount: number;
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
    product?: {
      productCode: string | null;
      category: string | null;
      fabricType: string | null;
      color: string | null;
      gsm: string | null;
    } | null;
  }[];
}

interface ReportData {
  period: string;
  startDate: Date;
  endDate: Date;
  invoices: ReportInvoice[];
  summary: ReportSummary;
}

function fmt(n: number): string {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = 'Rupees ' + convert(rupees);
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
  return result + ' Only';
}

function appendFullInvoices(doc: jsPDF, data: ReportData, isGST: boolean) {
  for (const inv of data.invoices) {
    doc.addPage();
    let y = 15;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(29, 30, 39);
    doc.setFont("helvetica", "bold");
    doc.text("FABRIC NATION", 105, y, { align: "center" });
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(75, 78, 83);
    doc.setFont("helvetica", "normal");
    doc.text("No.46 Rice mill compound, Alangadu, Karuvampalayam, Tirupur,Tamil Nadu - 641604", 105, y, { align: "center" });
    y += 4;
    doc.text("Ph: 9876543210 · Email: info@fabricnation.com", 105, y, { align: "center" });
    y += 6;
    
    // Line separator
    doc.setDrawColor(29, 30, 39);
    doc.line(14, y, 196, y);
    y += 6;

    // Invoice Title
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(29, 30, 39);
    doc.text(inv.type === "GST" ? "TAX INVOICE" : "CASH MEMO / ESTIMATE", 105, y, { align: "center" });
    y += 8;

    // Meta
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    // Left col
    doc.setFont("helvetica", "bold"); doc.text("Invoice No.", 14, y); doc.setFont("helvetica", "normal"); doc.text(`: ${inv.invoiceNumber}`, 40, y);
    doc.setFont("helvetica", "bold"); doc.text("Status", 110, y); doc.setFont("helvetica", "normal"); doc.text(`: ${inv.paymentStatus}`, 130, y);
    y += 5;
    
    doc.setFont("helvetica", "bold"); doc.text("Date", 14, y); doc.setFont("helvetica", "normal"); doc.text(`: ${fmtDate(inv.createdAt)}`, 40, y);
    doc.setFont("helvetica", "bold"); doc.text("State", 110, y); doc.setFont("helvetica", "normal"); doc.text(`: Tamil Nadu (33)`, 130, y);
    y += 5;

    if (inv.type === "GST") {
      doc.setFont("helvetica", "bold"); doc.text("GSTIN", 14, y); doc.setFont("helvetica", "normal"); doc.text(`: 33BCMPV5075R1ZK`, 40, y);
      y += 5;
    }
    
    doc.setFont("helvetica", "bold"); doc.text("Payment", 14, y); doc.setFont("helvetica", "normal"); doc.text(`: ${inv.paymentMethod}`, 40, y);
    y += 8;

    // Billing Addr
    doc.setFillColor(250, 251, 252);
    doc.rect(14, y, 84, 25, "F");
    doc.rect(102, y, 94, 25, "F");
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Billing Address", 16, y + 5);
    doc.text("Shipping Address", 104, y + 5);
    
    doc.setFont("helvetica", "normal");
    doc.text(inv.customerName || "Walk-in Customer", 16, y + 10);
    if (inv.customerGstin) doc.text(`GSTIN: ${inv.customerGstin}`, 16, y + 15);
    doc.text("Same as billing address", 104, y + 10);

    y += 30;

    // Items
    const itemsBody = inv.items.map((item, i) => {
      let description = item.productName;
      if (inv.type === "NON_GST" && item.product) {
        const details = [
          item.product.productCode ? `Code: ${item.product.productCode}` : null,
          item.product.category,
          item.product.fabricType,
          item.product.color,
          item.product.gsm ? `${item.product.gsm} GSM` : null,
        ].filter(Boolean).join(" • ");
        if (details) {
          description = `${item.productName}\n${details}`;
        }
      }
      return [
        i + 1,
        description,
        item.hsnCode || "—",
        item.quantity,
        item.unit,
        fmt(item.rate),
        fmt(item.quantity * item.rate)
      ];
    });

    autoTable(doc, {
      startY: y,
      theme: "grid",
      headStyles: { fillColor: [237, 242, 244], textColor: [29, 30, 39], fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [29, 30, 39] },
      head: [["S.No.", "Description of Goods", "HSN/SAC", "Quantity", "Unit", "Rate", "Amount (Rs.)"]],
      body: itemsBody,
      foot: [
        [
          { content: "Total Purchased Weight / Quantity:", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
          { content: inv.items.reduce((sum, item) => sum + item.quantity, 0).toFixed(2), styles: { fontStyle: "bold" } },
          { content: "", colSpan: 3 }
        ]
      ],
      footStyles: { fillColor: [237, 242, 244], textColor: [29, 30, 39], fontStyle: "bold", fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // Totals Table on right
    autoTable(doc, {
      startY: y,
      theme: "grid",
      headStyles: { fillColor: [237, 242, 244], textColor: [29, 30, 39], fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [29, 30, 39] },
      body: [
        ["Total", fmt(inv.subtotal)],
        ...(inv.discountAmount > 0 ? [["Discount", `- ${fmt(inv.discountAmount)}`]] : []),
        ...(inv.type === "GST" && inv.igstAmount === 0 && inv.sgstAmount > 0 ? [["SGST", fmt(inv.sgstAmount)], ["CGST", fmt(inv.cgstAmount)]] : []),
        ...(inv.type === "GST" && inv.igstAmount > 0 ? [["IGST", fmt(inv.igstAmount)]] : []),
        [{ content: "Grand Total", styles: { fontStyle: "bold" } }, { content: fmt(inv.totalAmount), styles: { fontStyle: "bold", textColor: [200, 0, 24] } }],
        // Partial payments
        ...((inv as any).paymentStatus !== "PAID" && (inv as any).amountPaid > 0 ? [["Amount Paid", fmt((inv as any).amountPaid)]] : []),
        ...((inv as any).paymentStatus !== "PAID" && (inv as any).balanceAmount > 0 ? [[{ content: "Balance Amount", styles: { fontStyle: "bold" } }, { content: fmt((inv as any).balanceAmount), styles: { fontStyle: "bold", textColor: [200, 0, 24] } }]] : []),
      ],
      margin: { left: 120, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // Amount in Words & Bank
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Rupees:", 14, y);
    doc.setFont("helvetica", "italic");
    doc.text(numberToWords(inv.totalAmount), 28, y);
    y += 6;
    
    doc.setFont("helvetica", "bold");
    doc.text("Bank Details:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text("Bank: HDFC Bank   |   A/c No: 50200012345678   |   IFSC: HDFC0001234   |   Branch: Tirupur", 14, y + 5);

    y += 15;

    // Terms
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("1. Any complaint regarding rates will not be entertained if not lodged within one week of receipt of this bill.", 14, y + 4);
    doc.text("2. Any complaint regarding quality must be made within 3 days of receipt of the goods.", 14, y + 8);
    doc.text("3. All disputes subject to Tirupur jurisdiction.", 14, y + 12);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("For Fabric Nation", 196, y, { align: "right" });
    doc.text("Authorised Signatory", 196, y + 15, { align: "right" });
  }
}


// ─── Shared header ───
function addHeader(doc: jsPDF, title: string, period: string, startDate: Date, endDate: Date) {
  // Company
  doc.setFontSize(18);
  doc.setTextColor(200, 0, 24);
  doc.setFont("helvetica", "bold");
  doc.text("FABRIC NATION", 105, 18, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(75, 78, 83);
  doc.setFont("helvetica", "normal");
  doc.text("No.46 Rice mill compound, Alangadu, Karuvampalayam, Tirupur,Tamil Nadu - 641604", 105, 24, { align: "center" });
  doc.text("Ph: 9876543210 · GSTIN: 33BCMPV5075R1ZK", 105, 28, { align: "center" });

  // Title
  doc.setDrawColor(29, 30, 39);
  doc.line(14, 32, 196, 32);
  doc.setFontSize(12);
  doc.setTextColor(29, 30, 39);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 39);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 78, 83);
  doc.text(`${period.charAt(0).toUpperCase() + period.slice(1)} Report · ${fmtDate(startDate)} to ${fmtDate(endDate)}`, 14, 44);
  doc.text(`Generated: ${fmtDate(new Date())}`, 196, 44, { align: "right" });

  return 50; // starting Y
}

// ═══════════════════════════════════════════
// WITH GST
// ═══════════════════════════════════════════
export function generatePDFWithGST(data: ReportData) {
  const doc = new jsPDF("p", "mm", "a4");
  
  // Filter for GST invoices only
  const gstInvoices = data.invoices.filter(inv => inv.type === "GST");
  
  // Calculate summary for GST invoices only
  const totalSubtotal = gstInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
  const totalDiscount = gstInvoices.reduce((sum, inv) => sum + inv.discountAmount, 0);
  const totalSgst = gstInvoices.reduce((sum, inv) => sum + inv.sgstAmount, 0);
  const totalCgst = gstInvoices.reduce((sum, inv) => sum + inv.cgstAmount, 0);
  const totalIgst = gstInvoices.reduce((sum, inv) => sum + inv.igstAmount, 0);
  const totalTax = totalSgst + totalCgst + totalIgst;
  const totalSales = gstInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidCount = gstInvoices.filter(i => i.paymentStatus === "PAID").length;
  const paidTotal = gstInvoices.filter(i => i.paymentStatus === "PAID").reduce((sum, i) => sum + i.totalAmount, 0);
  const unpaidCount = gstInvoices.filter(i => i.paymentStatus === "UNPAID").length;
  const unpaidTotal = gstInvoices.filter(i => i.paymentStatus === "UNPAID").reduce((sum, i) => sum + i.totalAmount, 0);

  let y = addHeader(doc, "Sales Report — GST Invoices", data.period, data.startDate, data.endDate);

  // Summary table
  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: [200, 0, 24], textColor: 255, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [29, 30, 39] },
    alternateRowStyles: { fillColor: [245, 247, 249] },
    head: [["Metric", "Value"]],
    body: [
      ["Total GST Invoices", String(gstInvoices.length)],
      ["Subtotal (Before Tax)", fmt(totalSubtotal)],
      ["Discount", fmt(totalDiscount)],
      ["SGST", fmt(totalSgst)],
      ["CGST", fmt(totalCgst)],
      ["IGST", fmt(totalIgst)],
      ["Total Tax Collected", fmt(totalTax)],
      ["Grand Total (Inc. Tax)", fmt(totalSales)],
      ["Paid", `${paidCount} — ${fmt(paidTotal)}`],
      ["Unpaid", `${unpaidCount} — ${fmt(unpaidTotal)}`],
    ],
    columnStyles: { 0: { cellWidth: 50, fontStyle: "bold" } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Invoice list
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(29, 30, 39);
  doc.text("Invoice Details", 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: [29, 30, 39], textColor: 255, fontStyle: "bold", fontSize: 7 },
    bodyStyles: { fontSize: 7, textColor: [29, 30, 39] },
    alternateRowStyles: { fillColor: [245, 247, 249] },
    head: [["S.No.", "Invoice", "Date", "Customer", "Type", "Subtotal", "SGST", "CGST", "IGST", "Total", "Status"]],
    body: gstInvoices.map((inv, index) => [
      index + 1,
      inv.invoiceNumber,
      fmtDate(inv.createdAt),
      inv.customerName || "Walk-in",
      inv.type === "GST" ? "GST" : "Non-GST",
      fmt(inv.subtotal),
      fmt(inv.sgstAmount),
      fmt(inv.cgstAmount),
      fmt(inv.igstAmount),
      fmt(inv.totalAmount),
      inv.paymentStatus,
    ]),
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Item detail
  if (y > 250) { doc.addPage(); y = 18; }
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Item-Level Detail", 14, y);
  y += 3;

  const itemRows: string[][] = [];
  let itemCounter = 1;
  for (const inv of gstInvoices) {
    for (const item of inv.items) {
      itemRows.push([
        String(itemCounter++),
        inv.invoiceNumber,
        item.productName,
        item.hsnCode || "—",
        String(item.quantity),
        item.unit,
        fmt(item.rate),
        fmt(item.quantity * item.rate),
        `${item.gstRate}%`,
        fmt(item.sgst),
        fmt(item.cgst),
        fmt(item.igst),
        fmt(item.amount),
      ]);
    }
  }

  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: [29, 30, 39], textColor: 255, fontStyle: "bold", fontSize: 6.5 },
    bodyStyles: { fontSize: 6.5, textColor: [29, 30, 39] },
    alternateRowStyles: { fillColor: [245, 247, 249] },
    head: [["S.No.", "Invoice", "Product", "HSN", "Qty", "Unit", "Rate", "Taxable", "GST%", "SGST", "CGST", "IGST", "Total"]],
    body: itemRows,
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = (doc as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text("Computer Generated Report — Fabric Nation", 105, 290, { align: "center" });
    doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: "right" });
  }

  appendFullInvoices(doc, { ...data, invoices: gstInvoices }, true);

  doc.save(`FabricNation_${data.period}_report_with_gst_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ═══════════════════════════════════════════
// WITHOUT GST
// ═══════════════════════════════════════════
export function generatePDFWithoutGST(data: ReportData) {
  const doc = new jsPDF("p", "mm", "a4");

  // Filter for NON-GST invoices only (fallback catch-all for any non-GST type)
  const nonGstInvoices = data.invoices.filter(inv => inv.type !== "GST");
  
  // Calculate summary for NON-GST invoices only
  const totalSubtotal = nonGstInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
  const totalDiscount = nonGstInvoices.reduce((sum, inv) => sum + inv.discountAmount, 0);
  const totalSales = nonGstInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidCount = nonGstInvoices.filter(i => i.paymentStatus === "PAID").length;
  const paidTotal = nonGstInvoices.filter(i => i.paymentStatus === "PAID").reduce((sum, i) => sum + i.totalAmount, 0);
  const unpaidCount = nonGstInvoices.filter(i => i.paymentStatus === "UNPAID").length;
  const unpaidTotal = nonGstInvoices.filter(i => i.paymentStatus === "UNPAID").reduce((sum, i) => sum + i.totalAmount, 0);

  let y = addHeader(doc, "Sales Report — Cash Bills (No GST)", data.period, data.startDate, data.endDate);

  // Summary
  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: [29, 30, 39], textColor: 255, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [29, 30, 39] },
    alternateRowStyles: { fillColor: [245, 247, 249] },
    head: [["Metric", "Value"]],
    body: [
      ["Total Cash Bills", String(nonGstInvoices.length)],
      ["Total Sales", fmt(totalSubtotal)],
      ["Discount", fmt(totalDiscount)],
      ["Net Sales", fmt(totalSales)],
      ["Paid", `${paidCount} — ${fmt(paidTotal)}`],
      ["Unpaid", `${unpaidCount} — ${fmt(unpaidTotal)}`],
    ],
    columnStyles: { 0: { cellWidth: 50, fontStyle: "bold" } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Invoices
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(29, 30, 39);
  doc.text("Invoice Details", 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: [29, 30, 39], textColor: 255, fontStyle: "bold", fontSize: 7 },
    bodyStyles: { fontSize: 7, textColor: [29, 30, 39] },
    alternateRowStyles: { fillColor: [245, 247, 249] },
    head: [["S.No.", "Invoice", "Date", "Customer", "Type", "Amount", "Discount", "Net Amount", "Payment", "Status"]],
    body: nonGstInvoices.map((inv, index) => [
      index + 1,
      inv.invoiceNumber,
      fmtDate(inv.createdAt),
      inv.customerName || "Walk-in",
      inv.type === "GST" ? "GST" : "Non-GST",
      fmt(inv.subtotal),
      fmt(inv.discountAmount),
      fmt(inv.subtotal - inv.discountAmount),
      inv.paymentMethod,
      inv.paymentStatus,
    ]),
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Items
  if (y > 250) { doc.addPage(); y = 18; }
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Item Details", 14, y);
  y += 3;

  const itemRows: string[][] = [];
  let itemCounter = 1;
  for (const inv of nonGstInvoices) {
    for (const item of inv.items) {
      let description = item.productName;
      if (item.product) {
        const details = [
          item.product.productCode ? `Code: ${item.product.productCode}` : null,
          item.product.category,
          item.product.fabricType,
          item.product.color,
          item.product.gsm ? `${item.product.gsm} GSM` : null,
        ].filter(Boolean).join(" • ");
        if (details) {
          description = `${item.productName}\n${details}`;
        }
      }
      itemRows.push([
        String(itemCounter++),
        inv.invoiceNumber,
        description,
        String(item.quantity),
        item.unit,
        fmt(item.rate),
        fmt(item.quantity * item.rate),
      ]);
    }
  }

  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: [29, 30, 39], textColor: 255, fontStyle: "bold", fontSize: 7 },
    bodyStyles: { fontSize: 7, textColor: [29, 30, 39] },
    alternateRowStyles: { fillColor: [245, 247, 249] },
    head: [["S.No.", "Invoice", "Product", "Qty", "Unit", "Rate", "Amount"]],
    body: itemRows,
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = (doc as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text("Computer Generated Report — Fabric Nation", 105, 290, { align: "center" });
    doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: "right" });
  }

  appendFullInvoices(doc, { ...data, invoices: nonGstInvoices }, false);

  doc.save(`FabricNation_${data.period}_report_cash_bills_${new Date().toISOString().slice(0, 10)}.pdf`);
}
