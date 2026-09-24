import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClipEarn — Get Paid to Post Short-Form Clips",
  description: "The premier payout and campaign platform for short-form video clippers and clip channels.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                localStorage.removeItem('clipearn_theme');
                document.documentElement.classList.add('dark');
                document.documentElement.classList.remove('light');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-[#070A0F] text-slate-100 min-h-screen antialiased selection:bg-brand-cyan/20 selection:text-brand-cyan">
        {children}
      </body>
    </html>
  );
}
