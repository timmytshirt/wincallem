import { PrismaClient } from "@prisma/client";

// Ensure the URL is present and force-inject it into Prisma
const url = process.env.DATABASE_URL;
if (!url || !url.startsWith("postgres")) {
  throw new Error("DATABASE_URL is missing or invalid in process.env");
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url } }, // <— inject at runtime so it can't be empty
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
