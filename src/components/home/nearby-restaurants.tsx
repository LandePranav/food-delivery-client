"use client"

import { useState, useEffect, useContext } from "react"
import Image from "next/image"
import Link from "next/link"
import { Store } from "lucide-react"
// import { Star, Store } from "lucide-react"
import api from "@/lib/axios"
import { context } from "@/context/contextProvider"

interface Restaurant {
  id: string
  name: string
  cuisine?: string
  specialty?: string
  distance?: string | number
  calculatedDistance?: number | null
  rating?: number
  reviewCount?: number
  image?: string
  imageUrl?: string | null
  profile?: string | null
  tags?: string[]
  gpsLocation?: {
    latitude: number
    longitude: number
  }
  deliveryTime?: string
}

interface NearbyRestaurantsProps {
  restaurants?: Restaurant[]
}

// Add this interface to define the seller shape
interface SellerData {
  id: string;
  name: string;
  restaurantName?: string;
  specialty?: string;
  gpsLocation?: {
    latitude: number;
    longitude: number;
  };
  distance?: string;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  profile?: string;
  tags?: string[];
  deliveryTime?: string;
}

export default function NearbyRestaurants({ restaurants = [] }: NearbyRestaurantsProps) {
  const [nearbyRestaurants, setNearbyRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [hasCalledApi, setHasCalledApi] = useState(false)
  const { userLocation, getDistanceFromUser } = useContext(context)
  
  useEffect(() => {
    // If we have restaurants props, use those instead of fetching
    if (restaurants && restaurants.length > 0) {
      setNearbyRestaurants(restaurants)
      setLoading(false)
      return;
    }
    
    // Only fetch if we haven't already done so
    if (!hasCalledApi) {
      const fetchNearbyRestaurants = async () => {
        try {
          setLoading(true)
          console.log("Fetching nearby restaurants") // Debug
          const response = await api.get("/sellers")
          if (response.status === 200) {
            console.log("Sellers response:", response.data) // Debug
            
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
              const formattedRestaurants = response.data.map((seller: SellerData) => {
                // Calculate distance if user location and seller GPS location are available
                let calculatedDistance = null
                if (seller.gpsLocation && userLocation) {
                  calculatedDistance = getDistanceFromUser(seller.gpsLocation)
                }
                
                return {
                  id: seller.id,
                  name: seller.restaurantName || seller.name,
                  cuisine: seller.specialty || "Various",
                  gpsLocation: seller.gpsLocation,
                  calculatedDistance,
                  // Format distance for display: either calculated or a default value
                  distance: calculatedDistance 
                    ? `${calculatedDistance.toFixed(1)} km away` 
                    : seller.distance || "1.5 miles away",
                  rating: seller.rating || 4.5,
                  reviewCount: seller.reviewCount || 100,
                  imageUrl: seller.imageUrl || null,
                  profile: seller.profile || null,
                  tags: seller.tags || [],
                  deliveryTime: seller.deliveryTime || "15-30 min"
                }
              })
              
              // Filter restaurants within 5km range
              const nearbyRestaurants = formattedRestaurants.filter(restaurant => 
                restaurant.calculatedDistance !== null && restaurant.calculatedDistance <= 5
              )
              
              // Sort by distance if calculated
              nearbyRestaurants.sort((a: Restaurant, b: Restaurant) => {
                const distA = a.calculatedDistance ?? Infinity
                const distB = b.calculatedDistance ?? Infinity
                return distA - distB
              })
              
              console.log("Formatted restaurants:", nearbyRestaurants) // Debug
              setNearbyRestaurants(nearbyRestaurants)
            } else {
              console.log("No restaurants data found")
              setNearbyRestaurants([])
            }
          }
        } catch (error) {
          console.error("Error fetching nearby restaurants:", error)
          setNearbyRestaurants([])
        } finally {
          setLoading(false)
          setHasCalledApi(true)
        }
      }
      
      fetchNearbyRestaurants()
    }
  }, [userLocation, getDistanceFromUser, restaurants, hasCalledApi])

  // Helper function to get the best available image URL
  const getImageUrl = (restaurant: Restaurant): string => {
    if (restaurant.imageUrl) return restaurant.imageUrl
    if (restaurant.profile) return restaurant.profile
    if (restaurant.image) return restaurant.image
    return "/placeholder.jpg"
  }
  
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold dark:text-white">Nearby Restaurants</h2>
        <Link 
          href="/restaurants"
          className="text-sm text-orange-500 dark:text-orange-400 font-medium hover:underline"
        >
          See All
        </Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : nearbyRestaurants.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm">
          <div className="flex flex-col items-center gap-2">
            <Store className="h-10 w-10 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">
              {userLocation 
                ? "No restaurants available within 4km of your location"
                : "Please enable location access to see nearby restaurants"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {nearbyRestaurants.slice(0, 3).map((restaurant) => (
            <Link 
              href={`/restaurant/${restaurant.id}`}
              key={restaurant.id}
              className="flex gap-4 items-center p-3 rounded-lg bg-white dark:bg-[#1E1E1E] shadow-sm border border-gray-100 dark:border-[#333333] hover:shadow-md transition-shadow"
            >
              <div className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0">
                {getImageUrl(restaurant) !== "/placeholder.jpg" ? (
                  <Image
                    src={getImageUrl(restaurant)}
                    alt={restaurant.name}
                    fill
                    sizes="(max-width: 768px) 100px, 100px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-gray-100 dark:bg-[#262626]">
                    <Store className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                  </div>
                )}
                {restaurant.tags && restaurant.tags.length > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                    <p className="text-xs text-white font-medium text-center">{restaurant.tags[0]}</p>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium text-base dark:text-white">{restaurant.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{restaurant.cuisine} • {restaurant.distance}</p>
                <div className="flex items-center justify-between mt-2">
                  {/* <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 dark:fill-white dark:text-white mr-1" />
                    <span className="text-sm font-medium dark:text-white">{restaurant.rating?.toFixed(1)}</span>
                    <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">({restaurant.reviewCount})</span>
                  </div> */}
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {restaurant.deliveryTime}
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {nearbyRestaurants.length > 3 && (
            <Link 
              href="/restaurants"
              className="flex justify-center items-center py-3 bg-white dark:bg-[#1E1E1E] rounded-lg text-orange-500 hover:text-orange-600 hover:bg-gray-50 dark:hover:bg-[#292929] transition-colors border border-gray-100 dark:border-[#333333] shadow-sm"
            >
              View {nearbyRestaurants.length - 3} more restaurants
            </Link>
          )}
        </div>
      )}
    </div>
  )
} 