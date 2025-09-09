// apps/web/app/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

const logLinks = process.env.LOG_MAGIC_LINKS === "1";

const emailProvider = EmailProvider({
  from: process.env.EMAIL_FROM || "noreply@wincallem.com",
  ...(logLinks
    ? {
        // Dev mode: don't send email — just print the link to the console
        async sendVerificationRequest({ identifier, url }) {
          console.log(`\n🔗 MAGIC LINK for ${identifier}:\n${url}\n`);
        },
      }
    : {
        // Real SMTP (Mailtrap)
        server: {
          host: process.env.EMAIL_HOST,
          port: Number(process.env.EMAIL_PORT || 587),
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        },
      }),
});

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [emailProvider],
};

