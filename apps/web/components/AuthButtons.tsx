"use client";
import { signIn, signOut, useSession } from "next-auth/react";

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
    <button onClick={() => signIn("email")} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">
      Login
    </button>
  );
}
