import { PrismaClient } from "@generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to access the database");
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let client = globalForPrisma.prisma;

// Resolve the client on first database access so credentials injected after the
// initial module evaluation are picked up by the preview runtime.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    client ??= createPrismaClient();
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
    return Reflect.get(client, property, receiver);
  },
});
