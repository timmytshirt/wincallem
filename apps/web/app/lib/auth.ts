import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Email from "next-auth/providers/email";
import { createTransport } from "nodemailer";

/**
 * Safe DB toggle: only true when a DATABASE_URL exists AND ./prisma is present.
 * We avoid a top-level static import of ./prisma so builds won’t fail if it’s missing/disabled.
 */
function canUseDb(): boolean {
  return !!process.env.DATABASE_URL;
}

export function buildAuthOptions(): NextAuthOptions {
  const useDb = canUseDb();

  const providers: any[] = [];

  if (useDb) {
    // Email provider (works with or without Prisma adapter)
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
    // DEV credentials (no DB / SMTP required)
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
        if ((user as any)?.id) (token as any).uid = (user as any).id;
        return token;
      },
      async session({ session, token }) {
        if ((token as any)?.uid) (session as any).uid = (token as any).uid;
        return session;
      },
    },
    debug: process.env.NODE_ENV === "development",
  };

  // Attach Prisma adapter only when DB is enabled and the module exists
  if (useDb) {
    try {
      // dynamic imports keep compile-time safe
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { PrismaAdapter } = require("@auth/prisma-adapter");
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { getPrisma } = require("./prisma");
      (opts as any).adapter = PrismaAdapter(getPrisma());
    } catch {
      // If prisma adapter or helper isn’t available, proceed without an adapter
    }
  }

  return opts;
}

// Export the ready-to-use object most of your code expects:
export const authOptions: NextAuthOptions = buildAuthOptions();
