export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Developer Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Dev Password", type: "password" },
      },
      async authorize(c) {
        if (!c?.password) return null;
        // DEV password set in .env
        return c.password === process.env.DEV_PASSWORD
          ? { id: "dev-user", name: "Dev User", email: String(c.email || "dev@local") }
          : null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && token.plan === undefined) token.plan = null;
      return token;
    },
    async session({ session, token }) {
      (session.user as any).plan = (token as any).plan ?? null;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
