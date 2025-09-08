import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";


// Avoid multiple Prisma clients in dev (hot reload)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;


export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_HOST!,
        port: Number(process.env.EMAIL_PORT || 2525),

        auth: {
          user: process.env.EMAIL_USER!,
          pass: process.env.EMAIL_PASS!,
        },

        auth: { user: process.env.EMAIL_USER!, pass: process.env.EMAIL_PASS! },

      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  secret: process.env.AUTH_SECRET,


  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) (token as any).uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if ((token as any)?.uid) (session as any).uid = (token as any).uid;
      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
};
