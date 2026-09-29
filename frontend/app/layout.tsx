import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "TeamUp & SocialFinding — Sports & Activity Platform",
  description: "Find local teammates, join recreational activities, and build your sports passport.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="bg-canvas-soft text-ink min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
