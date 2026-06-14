import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Friendlie — Find local activity partners & platonic friends",
  description:
    "Friendlie helps you meet nearby people who share your interests and activities. Strictly platonic — make new friends, find activity partners, plan hangouts.",
  openGraph: {
    title: "Friendlie",
    description:
      "Meet nearby people who share your interests. Strictly platonic friend-matching.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
