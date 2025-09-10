import { PrismaClient } from "@prisma/client";

// ⚠️ TEMP fallback: your Neon URLs (dev only). Remove after we confirm .env loads.
const FALLBACK_DB =
  "postgresql://neondb_owner:npg_O38PmNIrTJZL@ep-bold-butterfly-afbpaifj-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=1";
const FALLBACK_DIRECT =
  "postgresql://neondb_owner:npg_O38PmNIrTJZL@ep-bold-butterfly-afbpaifj.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";

let prisma: PrismaClient | undefined;

export function getPrisma() {
  const url =
    process.env.DATABASE_URL ||
    process.env.DIRECT_DATABASE_URL ||
    FALLBACK_DB;

  if (!/^postgres(ql)?:\/\//.test(url)) {
    throw new Error("DATABASE_URL is missing or invalid in process.env (and no fallback)");
  }

  if (!prisma) {
    prisma = new PrismaClient({ datasources: { db: { url } } });
    if (process.env.NODE_ENV !== "production") (globalThis as any).__prisma = prisma;
    console.log("🔌 Prisma connected using:", url.slice(0, 12)); // prints "postgresql://"
  }
  return prisma;
}
