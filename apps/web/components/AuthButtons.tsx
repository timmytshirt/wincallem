// apps/web/components/AuthButtons.tsx
"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function AuthButtons() {
  const { data: s } = useSession();
  return s ? (
    <div className="flex items-center gap-2">
      <span className="text-sm">Hi, {s.user?.email}</span>
      <button onClick={() => signOut()} className="px-2 py-1 text-xs bg-gray-800 text-white rounded">
        Logout
      </button>
    </div>
  ) : (
    <Link href="/api/auth/signin" className="px-2 py-1 text-xs bg-blue-600 text-white rounded">
      Login
    </Link>
  );
}
