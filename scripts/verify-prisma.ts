// Verify Prisma Postgres connection
import "dotenv/config";
import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const productCount = await prisma.product.count();
    const customerCount = await prisma.customer.count();
    const invoiceCount = await prisma.invoice.count();

    console.log(`✅ Connected to Prisma Postgres!`);
    console.log(`   📦 Products:  ${productCount}`);
    console.log(`   👥 Customers: ${customerCount}`);
    console.log(`   🧾 Invoices:  ${invoiceCount}`);
  } catch (error) {
    console.error("❌ Connection failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
