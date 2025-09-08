import ApiHealthBadge from "@/components/ApiHealthBadge";

export const metadata = {
  title: "WinCallem",
  description: "Betting intelligence boilerplate",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto max-w-5xl p-6">
          <nav className="flex items-center justify-between py-4">
            <h1 className="text-2xl font-bold">WinCallem</h1>
            <a className="text-sm underline" href="/dashboard">Dashboard</a>
          </nav>
          {children}
          <ApiHealthBadge />
        </div>
      </body>
    </html>
  );
}
