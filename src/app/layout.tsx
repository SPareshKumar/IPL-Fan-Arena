import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IPL Fan Arena",
  description: "Fantasy Cricket made Free",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-ipl-bg text-white min-h-screen`}>
          {children}
          {/* This enables the red toast notifications anywhere in the app */}
          <Toaster theme="dark" position="top-center" richColors />
      </body>
    </html>
  );
}