import { PrismaClient } from "@generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured. Add it in the project environment and restart the server.");
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const cachedPrisma = globalForPrisma.prisma as (PrismaClient & {
  invoice?: { findMany?: unknown };
}) | undefined;

export const prisma = cachedPrisma?.invoice?.findMany
  ? cachedPrisma
  : createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
