import { PrismaClient } from "@generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URL_2;

  if (!connectionString || connectionString.startsWith("process.env.")) {
    throw new Error("DATABASE_URL is not configured for this deployment.");
  }

  return connectionString;
}

function createPrismaClient() {
  const pool = new pg.Pool({ connectionString: getConnectionString() });
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
