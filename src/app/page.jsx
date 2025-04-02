"use client"

import { PageLayout } from "@/components/layout/page-layout"
import SpecialDishesCarousel from "@/components/home/special-dishes-carousel"
import { Categories } from "@/components/home/categories"
import PopularFoods from "@/components/home/popular-foods"
import NearbyRestaurants from "@/components/home/nearby-restaurants"
import { useEffect, useState } from "react"
import api from "@/lib/axios"

export default function Home() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState([
    { name: "Burger", emoji: "🍔" },
    { name: "Pizza", emoji: "🍕" },
    { name: "Fries", emoji: "🍟" },
    { name: "Drinks", emoji: "🥤" },
    { name: "Salad", emoji: "🥗" },
    { name: "Sushi", emoji: "🍣" },
    { name: "Dessert", emoji: "🍰" },
    { name: "Chicken", emoji: "🍗" },
  ])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log("Fetching products for home page") // Debug
        setIsLoading(true)
        const response = await api.get("/products")
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
        <PopularFoods items={products} limit={4} />

        {/* Nearby Restaurants */}
        <NearbyRestaurants />
      </div>
    </PageLayout>
  )
}