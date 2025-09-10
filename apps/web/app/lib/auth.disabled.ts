import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Email from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getPrisma, hasDb } from "./prisma";
import { createTransport } from "nodemailer";

export function buildAuthOptions(): NextAuthOptions {
  const useDb = hasDb();

  const providers: any[] = [];

  if (useDb) {
    // Email + Prisma (your original plan)
    providers.push(
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
            to: identifier,
            from: provider.from,
            subject: `Sign in to ${host}`,
            text: `Sign in to ${host}\n${url}\n`,
            html: `<p>Sign in to ${host}</p><p><a href="${url}">Click here to sign in</a></p>`,
          });
        },
      })
    );
  } else {
    // 🔒 DEV Credentials (no DB required)
    providers.push(
      Credentials({
        name: "Developer Login",
        credentials: {
          email: { label: "Email", type: "email", value: "dev@local" },
          password: { label: "Dev password", type: "password" },
        },
        async authorize(creds) {
          if (!creds?.password) return null;
          if (creds.password === process.env.DEV_PASSWORD) {
            return { id: "dev-user", email: String(creds.email || "dev@local"), name: "Dev User" };
          }
          return null;
        },
      })
    );
  }

  const opts: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: "jwt" },
    providers,
  };

  if (useDb) {
    opts.adapter = PrismaAdapter(getPrisma()) as any;
  }

  return opts;
}
