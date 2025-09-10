export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Minimal, DB-free config
const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Developer Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Dev Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.password) return null;
        if (creds.password === process.env.DEV_PASSWORD) {
          return { id: "dev-user", email: String(creds.email || "dev@local"), name: "Dev User" };
        }
        return null;
      },
    }),
  ],
});

export { handler as GET, handler as POST };


