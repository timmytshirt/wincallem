// apps/web/app/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Email from "next-auth/providers/email";

function canUseDb(): boolean {
  return !!process.env.DATABASE_URL;
}

export function buildAuthOptions(): NextAuthOptions {
  const useDb = canUseDb();
  const providers: any[] = [];

  if (useDb) {
    providers.push(
      Email({
        server: process.env.EMAIL_SERVER,
        from: process.env.EMAIL_FROM,
        async sendVerificationRequest({ identifier, url, provider }) {
          if (process.env.LOG_MAGIC_LINKS === "1") {
            console.log("\n🔗 Magic sign-in link for", identifier, ":\n", url, "\n");
            return;
          }
          // Lazy import nodemailer to avoid type deps
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { createTransport } = require("nodemailer");
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
    callbacks: {
      async jwt({ token, user }) {
        if (user && (user as any).id) {
          (token as any).uid = (user as any).id;
        }
        (token as any).uid = (token as any).uid || token.sub || null;
        return token;
      },
      async session({ session, token, user }) {
        const idFromUser = (user as any)?.id as string | undefined;
        const idFromToken = (token as any)?.uid || token.sub;
        if (session.user) {
          (session.user as any).id = idFromUser || idFromToken || null;
        }
        // keep your existing `session.uid` for back-compat
        (session as any).uid = (session.user as any)?.id || null;
        return session;
      },
    },
    debug: process.env.NODE_ENV === "development",
  };

  // Attach Prisma adapter dynamically (only when DB is configured)
  if (useDb) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PrismaAdapter } = require("@next-auth/prisma-adapter");
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();
      (opts as any).adapter = PrismaAdapter(prisma);
    } catch {
      // ignore if prisma not installed
    }
  }

  return opts;
}

export const authOptions: NextAuthOptions = buildAuthOptions();
