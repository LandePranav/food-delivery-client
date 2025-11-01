"use client"
// import type { Metadata } from "next";
// import {geistMono, geistSans, jet} from './fonts';
import {jet} from './fonts';
import { ThemeProvider } from "@/components/theme-provider";
import ContextProvider from "@/context/contextProvider";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
// export const metadata: Metadata = {
//   title: "Food Delivery",
//   description: "Ready to Fill Your Cravings!!",
// };

import {QueryClient, QueryClientProvider} from "@tanstack/react-query"; 
import { useState } from 'react';
import {Toaster} from "@/components/ui/sonner"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const [queryClient] = useState(()=> new QueryClient());
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jet.className} font-sans bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-gray-50`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="food-delivery-theme">
          <ContextProvider>
            <SessionProvider>
              <QueryClientProvider client={queryClient}>
                {children}
                <Toaster position="top-right" richColors />
              </QueryClientProvider>
            </SessionProvider>
          </ContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
