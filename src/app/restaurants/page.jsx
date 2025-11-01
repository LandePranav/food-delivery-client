"use client"

import { useState, useEffect, useContext, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { MapPin, Search, Store } from "lucide-react"
import { PageLayout } from "@/components/layout/page-layout"
import { context } from "@/context/contextProvider"
import { useFetchInfiniteRestaurants } from "@/queries/useRestaurants"
import { useGeolocation } from "@/hooks/useGeoLocation"
import CustomLoader from "@/components/common/CustomLoader"


export default function RestaurantsPage() {

  const [searchTerm, setSearchTerm] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const { userLocation} = useContext(context)
  const {location, err} = useGeolocation();

  const loadMoreRef = useRef(null);

  const {data, hasNextPage, fetchNextPage, isLoading, isFetchingNextPage} = useFetchInfiniteRestaurants(location?.lat, location?.lng,searchQuery);
  const restaurants = data ? data.pages.flatMap(page => page.formattedSellers) : [];

  useEffect(()=>{
    const searchTimeout = setTimeout(()=>{
      setSearchQuery(searchTerm)
    }, 500)
    return () => clearTimeout(searchTimeout);
  }, [searchTerm])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !loadMoreRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) fetchNextPage();
    });

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  },[hasNextPage, fetchNextPage])

  // Helper function to get the best available image URL
  const getImageUrl = (restaurant) => {
    if (restaurant.profile) return restaurant.profile
    if (restaurant.imageUrl) return restaurant.imageUrl
    return ""
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 pt-2 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">All Restaurants</h1>
        
        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-lg p-0.5 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search restaurants or cuisines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-10 border border-gray-300 dark:border-gray-700 dark:bg-[#292929] rounded-lg focus:ring-red-500 focus:border-red-500 dark:text-white"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            {/* <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#292929] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333333]">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button> */}
          </div>
        </div>
        
        {/* Restaurants Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#1E1E1E] rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm 
                ? "No restaurants match your search" 
                : userLocation 
                  ? "No restaurants available within 5km of your location"
                  : "Please enable location access to see nearby restaurants"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <Link
                href={`/restaurants/${restaurant.id}`}
                key={restaurant.id}
                className="bg-white dark:bg-[#1E1E1E] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-[#333333]"
              >
                <div className="relative h-48 w-full">
                  {
                    getImageUrl(restaurant) ? (
                      <Image
                        src={getImageUrl(restaurant)}
                        alt={restaurant.restaurantName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-[#262626]">
                        <Store className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                      </div>
                    )
                  }
                  {restaurant.productCount > 0 && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {restaurant.productCount} items
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                    {restaurant.restaurantName}
                  </h2>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {restaurant.specialty || "Various cuisines"}
                  </p>
                  
                  <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-red-500" />
                      <span>{!isNaN(parseInt(restaurant.distance)) ? parseInt(restaurant.distance) : '--'} kms away...</span>
                    </div>
                    
                    {/* Rating display (commented out as requested) */}
                    {/*
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1 fill-yellow-400 stroke-yellow-400" />
                      <span>4.5</span>
                    </div>
                    */}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {/* Infinite Scroll Trigger */}
          <div 
            ref={loadMoreRef} 
            className="text-muted-foreground flex h-10 justify-center items-center"
          >
            {isFetchingNextPage && (
              <div className="flex justify-center">
                <CustomLoader title="restaurants" />
              </div>
            )}
            {!hasNextPage && restaurants.length > 0 && (
              <div className="text-center py-4">
                <p className="text-gray-500">No more restaurants to load</p>
              </div>
            )}
          </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}