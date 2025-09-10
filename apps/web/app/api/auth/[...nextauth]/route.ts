import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SignJWT, jwtVerify } from "jose";

function getSecret() {
  return new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
}

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
      async authorize(c) {
        if (!c?.password) return null;
        return c.password === process.env.DEV_PASSWORD
          ? { id: "dev-user", name: "Dev User", email: String(c.email || "dev@local") }
          : null;
      },
    }),
  ],
  jwt: {
    // Force JWS (HS256) instead of encrypted JWE
    async encode({ token, secret }) {
      if (!token) return "";
      return await new SignJWT(token as any)
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(getSecret());
    },
    async decode({ token, secret }) {
      if (!token) return null;
      const { payload } = await jwtVerify(token, getSecret());
      return payload as any;
    },
  },
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

export { authHandler as GET, authHandler as POST };

