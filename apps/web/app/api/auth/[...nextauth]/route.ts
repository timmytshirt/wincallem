import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // if this alias fails, change to ../../../lib/auth

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
