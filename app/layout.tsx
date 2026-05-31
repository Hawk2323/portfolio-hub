import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

export const metadata: Metadata = {
  title: "Portfolio Hub",
  description: "Curated project portfolio hub.",
  robots: allowIndexing
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
