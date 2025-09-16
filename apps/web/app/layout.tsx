export const metadata = {
  title: "WinCallem — Under Construction",
  description: "Work in progress",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        background: "#0b1220",
        color: "#fff"
      }}>
        {children}
      </body>
    </html>
  );
}

