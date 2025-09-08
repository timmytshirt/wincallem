import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_HOST!,
        port: Number(process.env.EMAIL_PORT || 2525),
        auth: { user: process.env.EMAIL_USER!, pass: process.env.EMAIL_PASS! },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
