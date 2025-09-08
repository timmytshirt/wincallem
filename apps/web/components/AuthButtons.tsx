"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButtons() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex gap-2 items-center">
        <span className="text-sm">Hi, {session.user?.email}</span>
        <button
          onClick={() => signOut()}
          className="px-2 py-1 text-xs bg-gray-800 text-white rounded"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("email")}
      className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
    >
      Login
    </button>
  );
}
