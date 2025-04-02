"use client"

import { useState, useEffect, useContext } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, MapPin, Search, Filter } from "lucide-react"
import { PageLayout } from "@/components/layout/page-layout"
import api from "@/lib/axios"
import { context } from "@/context/contextProvider"

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { userLocation, getDistanceFromUser } = useContext(context)

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true)
        const response = await api.get("/sellers")
        if (response.status === 200) {
          let formattedRestaurants = response.data.map(seller => {
            // Calculate distance if user location and seller GPS location are available
            let calculatedDistance = null
            if (seller.gpsLocation && userLocation) {
              calculatedDistance = getDistanceFromUser(seller.gpsLocation)
            }
            
            return {
              ...seller,
              calculatedDistance,
              // Format distance for display: either calculated or default
              distance: calculatedDistance 
                ? `${calculatedDistance.toFixed(1)} km away` 
                : "Distance unavailable"
            }
          })
          
          // Sort by distance if available
          formattedRestaurants.sort((a, b) => {
            if (a.calculatedDistance !== null && b.calculatedDistance !== null) {
              return a.calculatedDistance - b.calculatedDistance
            }
            return 0
          })
          
          setRestaurants(formattedRestaurants)
        }
      } catch (error) {
        console.error("Error fetching restaurants:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurants()
  }, [userLocation, getDistanceFromUser])

  // Filter restaurants based on search term
  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (restaurant.specialty && restaurant.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Helper function to get the best available image URL
  const getImageUrl = (restaurant) => {
    if (restaurant.profile) return restaurant.profile
    if (restaurant.imageUrl) return restaurant.imageUrl
    return "/placeholder.jpg"
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">All Restaurants</h1>
        
        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-lg p-4 mb-6 shadow-sm">
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
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-[#292929] text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333333]">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>
        
        {/* Restaurants Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#1E1E1E] rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? "No restaurants match your search" : "No restaurants available"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <Link
                href={`/restaurant/${restaurant.id}`}
                key={restaurant.id}
                className="bg-white dark:bg-[#1E1E1E] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-[#333333]"
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={getImageUrl(restaurant)}
                    alt={restaurant.restaurantName}
                    fill
                    className="object-cover"
                  />
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
                      <span>{restaurant.distance}</span>
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
        )}
      </div>
    </PageLayout>
  )
} 