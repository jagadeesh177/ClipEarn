import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClipEarn — Get Paid to Post Short-Form Clips",
  description: "The premier creator payout & clipping campaign platform for short-form video editors, UGC creators, and brands.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070A0F] text-slate-100 min-h-screen antialiased selection:bg-brand-cyan/20 selection:text-brand-cyan">
        {children}
      </body>
    </html>
  );
}
