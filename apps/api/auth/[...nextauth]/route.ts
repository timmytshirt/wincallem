// apps/web/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISS = process.env.AUTH_JWT_ISS || "winclm";
const AUD = process.env.AUTH_JWT_AUD || "api";
const LOG_MAGIC = process.env.LOG_MAGIC_LINKS === "1";
const SMTP_URL = process.env.EMAIL_SERVER || process.env.SMTP_URL;

const base = PrismaAdapter(prisma) as Adapter;
const adapter: Adapter = {
  ...base,
  async createVerificationToken(token) {
    try {
      console.log("[adapter] createVerificationToken in", token);
      const out = await base.createVerificationToken!(token);
      console.log("[adapter] createVerificationToken out", out);
      return out;
    } catch (e: any) {
      console.error("[adapter] createVerificationToken FAILED:", e?.message || e);
      throw e;
    }
  },
  async useVerificationToken(params) {
    try {
      console.log("[adapter] useVerificationToken in", params);
      const out = await base.useVerificationToken!(params);
      console.log("[adapter] useVerificationToken out", out);
      return out;
    } catch (e: any) {
      console.error("[adapter] useVerificationToken FAILED:", e?.message || e);
      throw e;
    }
  },
};

const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NEXTAUTH_DEBUG === "true",
  session: { strategy: "jwt" },
  adapter,
  trustHost: true,
  logger: {
    error(code, meta) { console.error("[next-auth][error]", code, meta); },
    warn(code) { console.warn("[next-auth][warn]", code); },
    debug(code, meta) { console.log("[next-auth][debug]", code, meta); },
  },
  providers: [
    EmailProvider({
      server: SMTP_URL,                     // must be set (port 587 if 2525 is blocked)
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url, provider }) {
        if (LOG_MAGIC) { console.log("[next-auth][email-link]", url); return; }
        console.log("[mail] attempting send via", provider.server);
        try {
          const { createTransport } = await import("nodemailer");
          const t = createTransport(provider.server!);
          await t.verify();
          const info = await t.sendMail({
            to: identifier, from: provider.from!,
            subject: "Sign in to WinCallem",
            text: `Sign in link: ${url}`,
            html: `<p>Sign in link: <a href="${url}">${url}</a></p>`,
          });
          console.log("[mail] sent ok:", info.messageId);
        } catch (err: any) {
          console.error("[mail] send FAILED:", err?.message || err);
          throw err;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) { token.iss = ISS; token.aud = AUD; if (user?.id) token.sub = user.id; return token; },
    async session({ session }) { return session; },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
