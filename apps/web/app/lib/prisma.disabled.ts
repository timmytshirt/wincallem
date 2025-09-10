import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | undefined;

export function hasDb() {
  return Boolean(process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL);
}

export function getPrisma() {
  if (!hasDb()) {
    throw new Error("getPrisma() called but no DATABASE_URL/DIRECT_DATABASE_URL present");
  }
  if (!prisma) {
    const url = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL!;
    prisma = new PrismaClient({ datasources: { db: { url } } });
  }
  return prisma;
}
