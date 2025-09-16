"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";

export default function SignInPage() {
  const { data: session } = useSession();
  const [email, setEmail] = useState(process.env.NEXT_PUBLIC_DEV_LOGIN_EMAIL || "dev@wincallem.local");
  const [password, setPassword] = useState("");

  if (session?.user) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Signed in as {session.user.email}</h1>
        <button onClick={() => signOut()}>Sign out</button>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Sign in (dev)</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await signIn("credentials", { email, password, callbackUrl: "/" });
        }}
        style={{ display: "grid", gap: 8, maxWidth: 320 }}
      >
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
        <button type="submit">Sign in</button>
      </form>
      <p style={{ opacity: 0.7, marginTop: 8 }}>Default dev password is set in env.</p>
    </main>
  );
}

