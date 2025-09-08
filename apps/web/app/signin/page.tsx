"use client";
import { signIn } from "next-auth/react";

export default function SignIn() {
  return (
    <div className="p-6">
      <h1 className="text-xl mb-4">Sign In</h1>
      <button onClick={() => signIn("email")} className="px-3 py-2 bg-blue-600 text-white rounded">
        Email magic link
      </button>
    </div>
  );
}
