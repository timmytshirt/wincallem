// apps/web/lib/subscription.ts
import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;

export async function hasActiveSub(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  try {
    const row = await prisma.subscription.findFirst({
      where: { userId, status: { in: ["active", "trialing"] } },
      select: { id: true },
      take: 1, // optional; explicit
    });
    return !!row;
  } catch {
    // fail closed if DB hiccups
    return false;
  }
}

