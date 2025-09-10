// Force-load env for this process (works in Next route handlers too)
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const url =
  process.env.DATABASE_URL ||
  process.env.DIRECT_DATABASE_URL || // fallback if DATABASE_URL is missing
  "";

if (!/^postgres(ql)?:\/\//.test(url)) {
  throw new Error("DATABASE_URL is missing or invalid in process.env");
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url } }, // inject URL so Prisma can’t see an empty var
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
