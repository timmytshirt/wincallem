// apps/web/components/AuthButtons.tsx
"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function AuthButtons() {
  const { data: session, status } = useSession();
  const [busy, setBusy] = useState(false);

  const signedIn = status === "authenticated";

  return (
    <div className="flex items-center gap-3">
      {!signedIn ? (
        <button
          className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          onClick={() => { setBusy(true); signIn(undefined, { callbackUrl: "/account" }); }}
          disabled={busy}
        >
          {busy ? "Opening…" : "Sign in"}
        </button>
      ) : (
        <>
          <Link href="/account" className="px-3 py-2 rounded border">
            Account
          </Link>
          <button
            className="px-3 py-2 rounded bg-gray-800 text-white"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
          </button>
        </>
      )}
    </div>
  );
}
