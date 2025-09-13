export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "../../lib/prisma"; // use a relative path to avoid alias issues

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: process.env.NEXTAUTH_DEBUG === "true",
  session: { strategy: "jwt" },
  adapter: PrismaAdapter(prisma),          // <- REQUIRED for Email provider
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,    // smtp://USER:PASS@sandbox.smtp.mailtrap.io:2525
      from: process.env.EMAIL_FROM,        // noreply@wincallem.com
    }),
  ],
});

export { handler as GET, handler as POST };
