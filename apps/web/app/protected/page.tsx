import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/lib/auth";

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");

  return (
    <main className="p-6">
      <h2 className="text-xl font-bold mb-2">Protected</h2>
      <p>Welcome, {session.user?.email ?? "friend"} — you’re in.</p>
    </main>
  );
}
