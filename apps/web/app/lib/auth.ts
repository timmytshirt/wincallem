import type { NextAuthOptions } from "next-auth";
import Email from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getPrisma } from "./prisma";
import { createTransport } from "nodemailer";

export function buildAuthOptions(): NextAuthOptions {
  const prisma = getPrisma();

  return {
    secret: process.env.NEXTAUTH_SECRET,
    trustHost: true,
    session: { strategy: "jwt" },
    adapter: PrismaAdapter(prisma) as any,
    providers: [
      Email({
        server: process.env.EMAIL_SERVER,
        from: process.env.EMAIL_FROM,
        async sendVerificationRequest({ identifier, url, provider }) {
          if (process.env.LOG_MAGIC_LINKS === "1") {
            console.log("\n🔗 Magic sign-in link for", identifier, ":\n", url, "\n");
            return;
          }
          const transport = createTransport(provider.server as any);
          const { host } = new URL(url);
          await transport.sendMail({
            to: identifier, from: provider.from,
            subject: `Sign in to ${host}`,
            text: `Sign in to ${host}\n${url}\n`,
            html: `<p>Sign in to ${host}</p><p><a href="${url}">Click here to sign in</a></p>`,
          });
        },
      }),
    ],
  };
}
