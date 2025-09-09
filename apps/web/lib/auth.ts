// apps/web/lib/auth.ts
import "server-only";
import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma";
import nodemailer from "nodemailer";

// Build SMTP config from either EMAIL_SERVER or Mailtrap parts
function getSmtpConfig() {
  if (process.env.EMAIL_SERVER) return process.env.EMAIL_SERVER;
  if (process.env.EMAIL_HOST) {
    return {
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };
  }
  return undefined;
}

const FROM = process.env.EMAIL_FROM || "no-reply@localhost";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,

  // Use database sessions (Prisma Session table)
  session: { strategy: "database" },

  providers: [
    EmailProvider({
      from: FROM,
      // Force a fail-proof sender: try your SMTP first, then Ethereal
      async sendVerificationRequest({ identifier, url }) {
        // 1) Try your configured SMTP (Mailtrap)
        const smtp = getSmtpConfig();
        if (smtp) {
          try {
            const t = nodemailer.createTransport(smtp as any);
            await t.verify(); // quick sanity check
            const info = await t.sendMail({
              to: identifier,
              from: FROM,
              subject: "Sign in to WinCallem",
              html: `<p>Click to sign in:</p><p><a href="${url}">Sign in</a></p>`,
            });
            console.log("SMTP messageId:", info.messageId);
            return;
          } catch (err) {
            console.error("SMTP send failed, falling back to Ethereal:", err);
          }
        }

        // 2) Dev fallback: Ethereal (always works + prints preview link)
        const testAcc = await nodemailer.createTestAccount();
        const t = nodemailer.createTransport({
          host: testAcc.smtp.host,
          port: testAcc.smtp.port,
          secure: testAcc.smtp.secure,
          auth: { user: testAcc.user, pass: testAcc.pass },
        });
        const info = await t.sendMail({
          to: identifier,
          from: `"WinCallem" <no-reply@ethereal.email>`,
          subject: "Sign in to WinCallem",
          html: `<p>Click to sign in:</p><p><a href="${url}">Sign in</a></p>`,
        });
        const preview = nodemailer.getTestMessageUrl(info);
        if (preview) console.log("Ethereal preview:", preview);
      },
    }),
  ],

  // Make errors obvious in your terminal
  debug:
    process.env.NODE_ENV === "development" ||
    String(process.env.NEXTAUTH_DEBUG).toLowerCase() === "true",
  events: {
    error(err) {
      console.error("NextAuth error:", err);
    },
  },
};
