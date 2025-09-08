import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

// (Optional) avoid multiple Prisma clients during hot-reload in dev
const prisma = globalThis.__prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") (globalThis as any).__prisma = prisma;

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      // Use explicit SMTP fields from .env.local
      server: {
        host: process.env.EMAIL_HOST!,
        port: Number(process.env.EMAIL_PORT || 2525),
        auth: {
          user: process.env.EMAIL_USER!,
          pass: process.env.EMAIL_PASS!,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  // Helps in local dev and when behind proxies; silences host warnings
  trustHost: true,
  // Surface useful logs in your terminal while testing
  debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST };

