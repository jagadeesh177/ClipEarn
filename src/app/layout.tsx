import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// Self-hosted variable Archivo with the width axis: expanded cut for display,
// normal width for body copy.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ClipEarn: get paid for the views your clips earn",
  description: "Brands pay per 1,000 verified views. Clippers post short-form clips on their own accounts and get paid for what they earn.",
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
    <html lang="en" suppressHydrationWarning className={`dark ${archivo.variable}`}>
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
      <body className="bg-[var(--ink-0)] text-[var(--fg)] min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
