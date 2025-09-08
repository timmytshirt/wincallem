import { Providers } from "./providers";
import AuthButtons from "@/components/AuthButtons";
import ApiHealthBadge from "@/components/ApiHealthBadge";

export const metadata = {
  title: "WinCallem",
  description: "Betting intelligence boilerplate",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>
          <div className="mx-auto max-w-5xl p-6">
            <nav className="flex items-center justify-between py-4">
              <h1 className="text-2xl font-bold">WinCallem</h1>
              <div className="flex items-center gap-4">
                <a className="text-sm underline" href="/dashboard">Dashboard</a>
                <a className="text-sm underline" href="/protected">Pro Page</a>
                <AuthButtons />
              </div>
            </nav>
            {children}
            <ApiHealthBadge />
          </div>
        </Providers>
      </body>
    </html>
  );
}

