import NextAuth from "next-auth";
// ✅ correct path
import { authOptions } from "@/app/lib/auth";

// nodemailer needs Node, not Edge
export const runtime = "nodejs";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
