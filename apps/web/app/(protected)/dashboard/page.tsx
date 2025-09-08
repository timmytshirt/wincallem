import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import Link from "next/link";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) {
    // Simple redirect without middleware
    return (
      <div className="p-6">
        <p className="mb-3">You must be signed in to view the dashboard.</p>
        <Link href="/signin" className="underline">Go to Sign In</Link>
      </div>
    );
  }
  return <div className="p-6">Welcome, {session.user?.email}! ✅</div>;
}
