export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma"; // change to a relative path if '@' alias isn't set

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: process.env.NEXTAUTH_DEBUG === "true",
  session: { strategy: "jwt" },              // fine; adapter is still required for email
  adapter: PrismaAdapter(prisma),             // <-- THIS fixes EMAIL_REQUIRES_ADAPTER_ERROR
  providers: [
    EmailProvider({
      server: {
        host: process.env.MAILTRAP_HOST!,
        port: Number(process.env.MAILTRAP_PORT ?? "2525"),
        auth: {
          user: process.env.MAILTRAP_USER!,
          pass: process.env.MAILTRAP_PASS!,
        },
      },
      from: process.env.EMAIL_FROM!,
    }),
  ],
});

export { handler as GET, handler as POST };
