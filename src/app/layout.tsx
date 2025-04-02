"use client"
// import type { Metadata } from "next";
// import {geistMono, geistSans, jet} from './fonts';
import {jet} from './fonts';
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import ContextProvider from "@/context/contextProvider";
import { SessionProvider } from "next-auth/react";
// export const metadata: Metadata = {
//   title: "Food Delivery",
//   description: "Ready to Fill Your Cravings!!",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jet.className} font-sans bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-gray-50`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="food-delivery-theme">
          <ContextProvider>
            <SessionProvider>
              {children}
            </SessionProvider>
          </ContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
