"use client"

import { ReactNode } from "react"
import { Header } from "./header"
import { BottomNavigation } from "./bottom-navigation"

interface PageLayoutProps {
  children: ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <main className="flex min-h-screen flex-col pb-20 bg-gray-50 dark:bg-[#121212]">
      {/* Header - common for all pages */}
      <Header />

      {/* Main Content */}
      <section className="flex-1 p-4">
        {children}
      </section>

      {/* Bottom Navigation - common for all pages */}
      <BottomNavigation />
    </main>
  )
} 