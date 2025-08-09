"use client"

import { PageLayout } from "@/components/layout/page-layout"
import SpecialDishesCarousel from "@/components/home/special-dishes-carousel"
import { Categories } from "@/components/home/categories"
import PopularFoods from "@/components/home/popular-foods"
import NearbyRestaurants from "@/components/home/nearby-restaurants"
import { useEffect, useState, useContext } from "react"
import api from "@/lib/axios"
import { context } from "@/context/contextProvider"

export default function Home() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { userLocation } = useContext(context)
  const [sellers, setSellers] = useState([])
  const [sellersLoading, setSellersLoading] = useState(true)
  const [categories, setCategories] = useState([
    { name: "All", emoji: "🍽️" },
    { name: "Pure-Veg", emoji: "🥬" },
    { name: "Non-Veg", emoji: "🍗" },
    { name: "Specials", emoji: "✨" },
    { name: "Breakfast", emoji: "🍳" },
    { name: "Lunch", emoji: "🍱" },
    { name: "Dinner", emoji: "🍽️" },
    { name: "Drinks/Desserts", emoji: "🍰" },
    { name: "Maharashtrian", emoji: "🫓" },
    { name: "Chinese", emoji: "🥢" },
    { name: "North", emoji: "🍲" },
    { name: "South", emoji: "🥘" },
    { name: "Other", emoji: "🍴" },
  ])

  useEffect(() => {
    const fetchProducts = async () => {
      if (!userLocation) return
      try {
        console.log("Fetching products for home page") // Debug
        setIsLoading(true)
        
        // Build query parameters
        const params = new URLSearchParams()
        params.append('lat', userLocation.latitude.toString())
        params.append('lng', userLocation.longitude.toString())
        
        const response = await api.get(`/products?${params.toString()}`)
        if (response.status === 200) {
          console.log("Products fetched successfully:", response.data.length) // Debug
          setProducts(response.data)
        } else {
          console.log("Error fetching products")
        }
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [userLocation]) // Re-fetch when user location changes

  // Fetch sellers once for NearbyRestaurants to avoid internal refetch loops
  useEffect(() => {
    let cancelled = false
    const fetchSellers = async () => {
      try {
        setSellersLoading(true)
        const response = await api.get("/sellers")
        if (!cancelled && response.status === 200) {
          setSellers(Array.isArray(response.data) ? response.data : [])
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching sellers:", error)
          setSellers([])
        }
      } finally {
        if (!cancelled) setSellersLoading(false)
      }
    }

    fetchSellers()
    return () => { cancelled = true }
  }, [])

  // Debug render counts
  useEffect(() => {
    console.log("Products length:", products.length)
  }, [products])

  return (
    <PageLayout>
      <div className="px-2 pb-12">
        {/* Categories */}
        <Categories categories={categories} />

        {/* Special Dish Carousel */}
        <SpecialDishesCarousel />

        {/* Popular Foods */}
        <PopularFoods items={products} limit={6} />

        {/* Nearby Restaurants */}
        <NearbyRestaurants restaurants={sellers} />
      </div>
    </PageLayout>
  )
}