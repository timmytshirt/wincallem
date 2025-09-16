// Minimal, DB-free NextAuth config (Credentials provider only)
// Dev-only: login with fixed email/password from env.

import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const DEV_EMAIL = process.env.DEV_LOGIN_EMAIL || "dev@wincallem.local";
const DEV_PASSWORD = process.env.DEV_LOGIN_PASSWORD || "letmein";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Dev Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = (creds?.email || "").toString().toLowerCase();
        const password = (creds?.password || "").toString();
        if (email === DEV_EMAIL.toLowerCase() && password === DEV_PASSWORD) {
          return { id: "dev-user", name: "Developer", email: DEV_EMAIL };
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.email) {
        session.user = {
          ...session.user,
          email: token.email,
          name: token.name ?? null,
        } as any;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
