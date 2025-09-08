"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {


import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {

  return <SessionProvider>{children}</SessionProvider>;
}
