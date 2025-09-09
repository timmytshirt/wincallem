// apps/web/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
// Use a relative import to avoid path-alias issues
import { authOptions } from "../../../../lib/auth";

// ✅ Ensure Node runtime (nodemailer needs Node, not Edge)
export const runtime = "nodejs";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
