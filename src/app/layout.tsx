import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
// Auto-start simulation in development
import "@/lib/auto-simulator";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Movaa Park Admin Dashboard",
  description:
    "Comprehensive park administration system for bus booking management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
