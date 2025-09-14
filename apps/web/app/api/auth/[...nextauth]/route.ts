import NextAuth, { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISS = process.env.AUTH_JWT_ISS || "winclm";
const AUD = process.env.AUTH_JWT_AUD || "api";
const LOG_MAGIC = process.env.LOG_MAGIC_LINKS === "1";

// Helpful: confirm the DB URL proto/host at runtime
console.log("[env] DB proto:", (process.env.DATABASE_URL || "").slice(0, 10));
console.log("[env] NEXTAUTH_URL:", process.env.NEXTAUTH_URL);

const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NEXTAUTH_DEBUG === "true",
  session: { strategy: "jwt" },
  adapter: PrismaAdapter(prisma),

  logger: {
    error(code, metadata) {
      console.error("[next-auth][error]", code, metadata);
    },
    warn(code) {
      console.warn("[next-auth][warn]", code);
    },
    debug(code, metadata) {
      console.log("[next-auth][debug]", code, metadata);
    },
  },

  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,   // smtp://USER:PASS@sandbox.smtp.mailtrap.io:2525
      from: process.env.EMAIL_FROM,       // WinCallem <hello@wincallem.local>
      async sendVerificationRequest({ identifier, url, provider }) {
        if (LOG_MAGIC) {
          console.log("[next-auth][email-link]", url);
          return;
        }

        console.log("[mail] attempting send");
        console.log("[mail] server:", provider.server ? "<set>" : "<missing>");
        console.log("[mail] from:", provider.from);

        try {
          const { createTransport } = await import("nodemailer");
          const transport = createTransport(provider.server!);
          await transport.verify(); // fail fast with a clear reason

          const info = await transport.sendMail({
            to: identifier,
            from: provider.from!,
            subject: "Sign in to WinCallem",
            text: `Sign in link: ${url}`,
            html: `<p>Sign in link: <a href="${url}">${url}</a></p>`,
          });

          console.log("[mail] sent ok:", info.messageId);
        } catch (err: any) {
          console.error("[mail] send failed:", err?.message || err);
          throw err; // surface cause to EmailSignin banner and terminal
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      token.iss = ISS;
      token.aud = AUD;
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session }) {
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
