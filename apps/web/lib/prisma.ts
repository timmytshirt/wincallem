// apps/web/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Standard lazy singleton. Do NOT read env or set datasources here.
// Prisma will pick up DATABASE_URL/DIRECT_DATABASE_URL at runtime.
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
