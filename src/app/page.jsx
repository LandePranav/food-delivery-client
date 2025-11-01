"use client"

import { PageLayout } from "@/components/layout/page-layout"
import SpecialDishesCarousel from "@/components/home/special-dishes-carousel"
import { Categories } from "@/components/home/categories"
import PopularFoods from "@/components/home/popular-foods"
import NearbyRestaurants from "@/components/home/nearby-restaurants"
import { useState, } from "react"
import { useFetchInfiniteProducts } from "@/queries/useProducts"
import { useFetchInfiniteRestaurants } from "@/queries/useRestaurants"
import CustomLoader from "@/components/common/CustomLoader"
import { useGeolocation } from "@/hooks/useGeoLocation"

export default function Home() {
  // const { userLocation } = useContext(context)
  const {location} = useGeolocation()
  const categories =[
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
  ]

  const {data: restaurantsData, isLoading:isLoadingRestaurants, isError: isErrorRestaurants} = useFetchInfiniteRestaurants(location?.lat, location?.lng, "", 10);
  const {data: productsData, isLoading:isLoadingProducts, isError:isErrorProducts} = useFetchInfiniteProducts(location?.lat, location?.lng, "", "all", 8,'', {sort: "popularity"});

  const restaurants = restaurantsData ? restaurantsData.pages.flatMap(page => page.formattedSellers) : [];
  const products = productsData ? productsData.pages.flatMap(page => page.formattedProducts) : [];

  return (
    <PageLayout>
      <div className="px-2 pb-12 space-y-4">
        {/* Categories */}
        <Categories categories={categories} />

        {/* Special Dish Carousel */}
        <SpecialDishesCarousel />

        {/* Popular Foods */}
        {
          isLoadingProducts ? (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                Popular Foods
              </h2>
              <div className="flex justify-center py-8 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            </div>
          ) : (
            isErrorProducts ? (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  Nearby Restaurants
                </h2>
                <div className="flex justify-center py-8 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm">
                  <p className="text-red-500 text-center">
                    Failed to load popular foods.
                  </p>
                </div>
              </div>
            ) :
            <PopularFoods items={products} limit={10} />
          )
        }

        {/* Nearby Restaurants */}
        { isLoadingRestaurants ? (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Nearby Restaurants
            </h2>
            <div className="flex justify-center py-8 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          </div>
        ) : (
          isErrorRestaurants ? (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                Nearby Restaurants
              </h2>
              <div className="flex justify-center py-8 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm">
                <p className="text-red-500 text-center">
                  Failed to load nearby restaurants.
                </p>
              </div>
            </div>
          )
          :
        <NearbyRestaurants restaurants={restaurants} />)}
      </div>
    </PageLayout>
  )
}