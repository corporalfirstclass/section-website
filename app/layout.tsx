import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crafting digital experiences of tomorrow | Section",
  description:
    "We design data-driven digital products and solutions for marketing channels — implemented with enterprise-level technology for security and scalability.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
