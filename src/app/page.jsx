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
      try {
        console.log("Fetching products for home page") // Debug
        setIsLoading(true)
        
        // Build query parameters
        const params = new URLSearchParams()
        if (userLocation) {
          params.append('lat', userLocation.latitude.toString())
          params.append('lng', userLocation.longitude.toString())
        }
        
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
        <PopularFoods items={products} limit={4} />

        {/* Nearby Restaurants */}
        <NearbyRestaurants />
      </div>
    </PageLayout>
  )
}