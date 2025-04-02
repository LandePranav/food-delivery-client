"use client"

import { useState, useEffect } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import api from "@/lib/axios"

export default function TestSellers() {
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        setLoading(true)
        const response = await api.get("/sellers")
        console.log("Sellers API response:", response)
        setSellers(response.data || [])
      } catch (error) {
        console.error("Error fetching sellers:", error)
        setError(error.message || "Failed to fetch sellers")
      } finally {
        setLoading(false)
      }
    }

    fetchSellers()
  }, [])

  return (
    <PageLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Test Sellers API</h1>
        
        {loading ? (
          <div className="text-center py-8">Loading sellers...</div>
        ) : error ? (
          <div className="text-red-500 py-4">
            <p>Error: {error}</p>
            <p className="mt-2">Check the console for more details.</p>
          </div>
        ) : sellers.length === 0 ? (
          <div className="text-center py-8">No sellers found.</div>
        ) : (
          <div className="space-y-4">
            <p className="font-medium">Found {sellers.length} sellers:</p>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(sellers, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </PageLayout>
  )
} 