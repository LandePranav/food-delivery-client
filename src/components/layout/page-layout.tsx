"use client"

import { ReactNode } from "react"
import { Header } from "./header"
import { BottomNavigation } from "./bottom-navigation"
import Link from "next/link"
import { satisfy } from "@/app/fonts"

interface PageLayoutProps {
  children: ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <main className="flex min-h-screen flex-col pb-20 bg-gray-50 dark:bg-[#121212]">
      {/* Header - common for all pages */}
      <Header />

      {/* Main Content */}
      <section className="flex-1 p-4 flex flex-col">
        <div className="flex-grow">
          {children}
        </div>
        
        {/* Footer */}
        <div className="mt-auto pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400 text-sm flex justify-center items-center gap-4 sm:gap-8">
          <div className={`${satisfy.className} text-xl`}>
            <span className="text-red-500">B</span>ites
          </div>
          <Link href="/about" className="hover:text-red-500 transition-colors">
            About Us
          </Link>
        </div>
      </section>

      {/* Bottom Navigation - common for all pages */}
      <BottomNavigation />
    </main>
  )
} 