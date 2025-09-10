// apps/web/app/lib/auth.disabled.ts
// ----------------------------------------------------------
// Disabled Prisma-based NextAuth config.
// This file exists only to keep type-checking/CI happy.
// It is NOT imported or used anywhere in the app.
// ----------------------------------------------------------

import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
};

export default authOptions;
