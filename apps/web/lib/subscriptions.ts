// apps/web/lib/subscription.ts
import { PrismaClient } from "@prisma/client";

// Reuse a single Prisma instance in dev to avoid connection churn
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;

/**
 * Returns true if the user currently has an active (or trialing) subscription.
 */
export async function hasActiveSub(userId: string | undefined | null): Promise<boolean> {
  if (!userId) return false;
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: { in: ["active", "trialing"] } },
    select: { id: true },
  });
  return !!sub;
}
