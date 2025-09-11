import AccountPlan from "@/components/AccountPlan";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { headers } from "next/headers";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  // Fire-and-forget sync on server render
  // (Next App Router allows fetch from server components)
  const h = headers();
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/billing/sync`, {
    method: "POST",
    headers: { cookie: h.get("cookie") ?? "" },
    cache: "no-store",
  }).catch(() => {});

  return (
    // ...rest of the JSX from the earlier snippet...
  );
}

