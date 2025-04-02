"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageLayout } from "@/components/layout/page-layout"

export default function FoodDetailRedirect({ params }) {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the main menu page
    router.push("/menu")
  }, [router])

  return (
    <PageLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Redirecting...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
        </div>
      </div>
    </PageLayout>
  )
} 