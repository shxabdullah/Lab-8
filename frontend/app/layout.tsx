import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "North & Pine — Everyday, upgraded.",
  description: "A modern storefront for thoughtfully designed everyday goods.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
