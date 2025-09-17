import type { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      maxAge: 60 * 60, // 1h magic links
    }),
  ],
  session: { strategy: 'database' }, // uses Session table in your schema
  debug: process.env.NEXTAUTH_DEBUG === 'true',
  secret: process.env.NEXTAUTH_SECRET,
}

