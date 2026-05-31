// Seed script for Prisma Postgres — populates the database with sample data
import "dotenv/config";
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data in dependency order
  await prisma.stockLedger.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.setting.deleteMany();

  // ─── PRODUCTS ────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.create({ data: { name: "Star Aop", hsnCode: "5208", category: "Single Jersey", unit: "KILOGRAM", costPrice: 320, sellingPrice: 350, gstRate: 5, currentStock: 250, lowStockThreshold: 20 } }),
    prisma.product.create({ data: { name: "Black Aop", hsnCode: "5007", category: "Slub Jersey", unit: "KILOGRAM", costPrice: 300, sellingPrice: 380, gstRate: 5, currentStock: 45, lowStockThreshold: 10 } }),
    prisma.product.create({ data: { name: "PC Aop", hsnCode: "5407", category: "French Terry", unit: "KILOGRAM", costPrice: 300, sellingPrice: 380, gstRate: 12, currentStock: 180, lowStockThreshold: 30 } }),
    prisma.product.create({ data: { name: "Dot Printed", hsnCode: "5309", category: "Pique", unit: "KILOGRAM", costPrice: 350, sellingPrice: 520, gstRate: 5, currentStock: 8, lowStockThreshold: 15 } }),
    prisma.product.create({ data: { name: "Printed Floral", hsnCode: "5407", category: "Airtex", unit: "KILOGRAM", costPrice: 200, sellingPrice: 320, gstRate: 5, currentStock: 65, lowStockThreshold: 10 } }),
    prisma.product.create({ data: { name: "Black Plain", hsnCode: "5209", category: "Lycra Jersey", unit: "KILOGRAM", costPrice: 280, sellingPrice: 420, gstRate: 12, currentStock: 3, lowStockThreshold: 15 } }),
    prisma.product.create({ data: { name: "Pearl White", hsnCode: "5407", category: "Single Jersey", unit: "KILOGRAM", costPrice: 180, sellingPrice: 280, gstRate: 5, currentStock: 90, lowStockThreshold: 15 } }),
    prisma.product.create({ data: { name: "Royal Blue", hsnCode: "5801", category: "Lycra Rib 2x2", unit: "KILOGRAM", costPrice: 450, sellingPrice: 680, gstRate: 12, currentStock: 22, lowStockThreshold: 8 } }),
    prisma.product.create({ data: { name: "Pink Melange", hsnCode: "5408", category: "Cotton Rib 1x1", unit: "KILOGRAM", costPrice: 220, sellingPrice: 350, gstRate: 5, currentStock: 35, lowStockThreshold: 10 } }),
    prisma.product.create({ data: { name: "Camel Aop", hsnCode: "5208", category: "Interlock", unit: "KILOGRAM", costPrice: 95, sellingPrice: 160, gstRate: 5, currentStock: 4, lowStockThreshold: 20 } }),
    prisma.product.create({ data: { name: "White Rib", hsnCode: "5407", category: "Cotton Rib 2x2", unit: "KILOGRAM", costPrice: 320, sellingPrice: 500, gstRate: 5, currentStock: 40, lowStockThreshold: 8 } }),
    prisma.product.create({ data: { name: "Grey Melange Rib", hsnCode: "5007", category: "Lycra Rib 1x1", unit: "KILOGRAM", costPrice: 260, sellingPrice: 400, gstRate: 5, currentStock: 55, lowStockThreshold: 12 } }),
  ]);

  // ─── STOCK LEDGER (initial inward entries) ───────────────
  for (const p of products) {
    await prisma.stockLedger.create({
      data: {
        productId: p.id,
        type: "INWARD",
        quantity: p.currentStock,
        referenceType: "MANUAL",
        notes: "Initial stock entry",
        balanceAfter: p.currentStock,
      },
    });
  }

  // ─── CUSTOMERS ───────────────────────────────────────────
  const customers = await Promise.all([
    prisma.customer.create({ data: { name: "Lakshmi Textiles", phone: "9876543210", email: "lakshmi@textiles.in", gstin: "33AABCL1234F1Z5", address: "42 Ranganathan Street", city: "Chennai", stateCode: "33", pincode: "600017" } }),
    prisma.customer.create({ data: { name: "Rajesh Kumar", phone: "9845123456", email: "rajesh.k@gmail.com", address: "15 Gandhi Road", city: "Coimbatore", stateCode: "33", pincode: "641001" } }),
    prisma.customer.create({ data: { name: "Mumbai Fashion Hub", phone: "9820456789", gstin: "27AABCM5678G1Z3", address: "Shop 12, Crawford Market", city: "Mumbai", stateCode: "27", pincode: "400001" } }),
    prisma.customer.create({ data: { name: "Priya Silks & Sarees", phone: "9944556677", gstin: "33AABCP9012H1Z1", address: "8 Usman Road, T Nagar", city: "Chennai", stateCode: "33", pincode: "600017" } }),
    prisma.customer.create({ data: { name: "Anitha Devi", phone: "9787654321", address: "23 Temple Street", city: "Madurai", stateCode: "33", pincode: "625001" } }),
  ]);

  // ─── INVOICES ────────────────────────────────────────────
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const threeDaysAgo = new Date(today); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const fourDaysAgo = new Date(today); fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
  const fiveDaysAgo = new Date(today); fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const sixDaysAgo = new Date(today); sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

  await prisma.invoice.create({ data: { invoiceNumber: "INV-2026-001", type: "GST", customerId: customers[0].id, customerName: customers[0].name, customerPhone: customers[0].phone, customerGstin: customers[0].gstin, subtotal: 4500, cgstAmount: 112.5, sgstAmount: 112.5, totalAmount: 4725, paymentMethod: "UPI", paymentStatus: "PAID", createdAt: sixDaysAgo, updatedAt: sixDaysAgo, items: { create: [{ productId: products[0].id, productName: "Pure Cotton White", hsnCode: "5208", unit: "METER", quantity: 10, rate: 180, gstRate: 5, cgst: 45, sgst: 45, amount: 1890 }, { productId: products[4].id, productName: "Georgette Printed Floral", hsnCode: "5407", unit: "METER", quantity: 8.5, rate: 320, gstRate: 5, cgst: 68, sgst: 68, amount: 2856 }] } } });
  await prisma.invoice.create({ data: { invoiceNumber: "EST-2026-001", type: "NON_GST", customerName: "Walk-in Customer", customerPhone: "9800012345", subtotal: 1120, totalAmount: 1120, paymentMethod: "CASH", paymentStatus: "PAID", createdAt: fiveDaysAgo, updatedAt: fiveDaysAgo, items: { create: [{ productId: products[2].id, productName: "Polyester Blend Blue", hsnCode: "5407", unit: "METER", quantity: 4, rate: 140, amount: 560 }, { productId: products[6].id, productName: "Chiffon Pearl White", hsnCode: "5407", unit: "METER", quantity: 2, rate: 280, amount: 560 }] } } });
  await prisma.invoice.create({ data: { invoiceNumber: "INV-2026-002", type: "GST", customerId: customers[2].id, customerName: customers[2].name, customerPhone: customers[2].phone, customerGstin: customers[2].gstin, subtotal: 8400, igstAmount: 420, totalAmount: 8820, paymentMethod: "CARD", paymentStatus: "PAID", createdAt: fourDaysAgo, updatedAt: fourDaysAgo, items: { create: [{ productId: products[1].id, productName: "Silk Banarasi Gold", hsnCode: "5007", unit: "METER", quantity: 7, rate: 1200, gstRate: 5, igst: 420, amount: 8820 }] } } });
  await prisma.invoice.create({ data: { invoiceNumber: "EST-2026-002", type: "NON_GST", customerName: "Meena", customerPhone: "9876000111", subtotal: 2380, totalAmount: 2380, paymentMethod: "UPI", paymentStatus: "PAID", createdAt: threeDaysAgo, updatedAt: threeDaysAgo, items: { create: [{ productId: products[7].id, productName: "Velvet Royal Purple", hsnCode: "5801", unit: "METER", quantity: 3.5, rate: 680, amount: 2380 }] } } });
  await prisma.invoice.create({ data: { invoiceNumber: "INV-2026-003", type: "GST", customerId: customers[3].id, customerName: customers[3].name, customerPhone: customers[3].phone, customerGstin: customers[3].gstin, subtotal: 6000, cgstAmount: 150, sgstAmount: 150, totalAmount: 6300, paymentMethod: "CREDIT", paymentStatus: "UNPAID", createdAt: twoDaysAgo, updatedAt: twoDaysAgo, items: { create: [{ productId: products[10].id, productName: "Organza Shimmer Gold", hsnCode: "5407", unit: "METER", quantity: 12, rate: 500, gstRate: 5, cgst: 150, sgst: 150, amount: 6300 }] } } });
  await prisma.invoice.create({ data: { invoiceNumber: "EST-2026-003", type: "NON_GST", customerName: "Ravi Shankar", customerPhone: "9600112233", subtotal: 3200, totalAmount: 3200, paymentMethod: "CASH", paymentStatus: "PAID", createdAt: yesterday, updatedAt: yesterday, items: { create: [{ productId: products[11].id, productName: "Satin Duchess Ivory", hsnCode: "5007", unit: "METER", quantity: 8, rate: 400, amount: 3200 }] } } });
  await prisma.invoice.create({ data: { invoiceNumber: "INV-2026-004", type: "GST", customerId: customers[1].id, customerName: customers[1].name, customerPhone: customers[1].phone, subtotal: 2600, cgstAmount: 65, sgstAmount: 65, totalAmount: 2730, paymentMethod: "UPI", paymentStatus: "PAID", createdAt: today, updatedAt: today, items: { create: [{ productId: products[8].id, productName: "Rayon Printed Multi", hsnCode: "5408", unit: "KILOGRAM", quantity: 7.5, rate: 350, gstRate: 5, cgst: 65, sgst: 65, amount: 2730 }] } } });

  // ─── SETTINGS ────────────────────────────────────────────
  await prisma.setting.createMany({
    data: [
      { key: "business_name", value: "DigitKraft Textiles" },
      { key: "gst_number", value: "33AABCD1234E1Z5" },
      { key: "currency", value: "INR" },
    ],
  });

  console.log(`✅ Seeded ${products.length} products, ${customers.length} customers, 7 invoices, 3 settings`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
