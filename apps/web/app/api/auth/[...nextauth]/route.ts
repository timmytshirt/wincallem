export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// DB-free dev login (no Prisma, no email)
const authHandler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Developer Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Dev Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.password) return null;
        if (credentials.password === process.env.DEV_PASSWORD) {
          return {
            id: "dev-user",
            name: "Dev User",
            email: String(credentials.email || "dev@local"),
          };
        }
        return null;
      },
    }),
  ],
});

export { authHandler as GET, authHandler as POST };
