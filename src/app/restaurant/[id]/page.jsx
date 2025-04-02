"use client"

import { useState, useEffect, useContext } from "react"
import Image from "next/image"
import { Star, Clock, MapPin, Phone, ShoppingCart } from "lucide-react"
import { PageLayout } from "@/components/layout/page-layout"
import api from "@/lib/axios"
import { context } from "@/context/contextProvider"

export default function RestaurantDetail({ params }) {
  const { id } = params
  const [restaurant, setRestaurant] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { addToCart, userLocation, getDistanceFromUser } = useContext(context)
  const [distance, setDistance] = useState(null)

  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true)
        
        // Fetch restaurant details
        const restaurantResponse = await api.get(`/sellers/${id}`)
        if (restaurantResponse.status === 200) {
          const restaurantData = restaurantResponse.data
          setRestaurant(restaurantData)
          
          // Calculate distance if GPS location is available
          if (restaurantData.gpsLocation && userLocation) {
            const calculatedDistance = getDistanceFromUser(restaurantData.gpsLocation)
            if (calculatedDistance) {
              setDistance(calculatedDistance)
            }
          }
        }
        
        // Fetch products from this restaurant
        const productsResponse = await api.get(`/products?sellerId=${id}`)
        if (productsResponse.status === 200) {
          setProducts(productsResponse.data)
        }
      } catch (error) {
        console.error("Error fetching restaurant data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchRestaurantData()
    }
  }, [id, userLocation, getDistanceFromUser])

  // Recalculate distance if user location changes
  useEffect(() => {
    if (restaurant?.gpsLocation && userLocation) {
      const calculatedDistance = getDistanceFromUser(restaurant.gpsLocation)
      if (calculatedDistance) {
        setDistance(calculatedDistance)
      }
    }
  }, [restaurant, userLocation, getDistanceFromUser])

  const handleAddToCart = (product) => {
    const item = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: getImageUrl(product),
      sellerId: product.sellerId
    };
    
    addToCart(item);
    
    // Show a quick toast or feedback
    alert(`${product.name} added to cart!`)
  }

  // Helper function to get the best available image URL
  const getImageUrl = (item) => {
    if (item.imageUrl) return item.imageUrl
    if (item.image) return item.image
    if (item.imageUrls && item.imageUrls.length > 0) return item.imageUrls[0]
    return "/placeholder.jpg"
  }
  
  // Format price with rupee symbol
  const formatPrice = (price) => {
    return `₹${parseFloat(price).toFixed(2)}`;
  };

  return (
    <PageLayout>
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      ) : restaurant ? (
        <div className="container mx-auto">
          {/* Restaurant Cover */}
          <div className="relative h-40 md:h-56 w-full mb-6">
            <Image
              src={restaurant.imageUrl || restaurant.profile || "/placeholder.jpg"}
              alt={restaurant.name}
              fill
              className="object-cover rounded-xl"
            />
            <div className="absolute inset-0 bg-black opacity-40 rounded-xl"></div>
            <div className="absolute bottom-4 left-4 text-white">
              <h1 className="text-xl md:text-2xl font-bold mb-1">{restaurant.restaurantName || restaurant.name}</h1>
              <div className="flex items-center text-sm">
                <span>{restaurant.specialty || "Various"}</span>
                {/* Ratings commented out as requested */}
                {/*
                <span className="mx-2">•</span>
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 stroke-yellow-400 mr-1" />
                  <span>{restaurant.rating || 4.5}</span>
                </div>
                */}
              </div>
            </div>
          </div>

          {/* Restaurant Info */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-red-500" />
                <span>
                  {restaurant.address || "Address not available"}
                  {distance && <span className="ml-1">({distance.toFixed(1)} km away)</span>}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-red-500" />
                <span>Open 9:00 AM - 10:00 PM</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-1 text-red-500" />
                <span>{restaurant.phone || "Phone not available"}</span>
              </div>
            </div>
          </div>

          {/* Products */}
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Menu</h2>
          
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {products.map((product) => (
                <div 
                  key={product.id}
                  className="bg-white dark:bg-[#1E1E1E] rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-[#333333]"
                >
                  <div className="flex">
                    <div className="relative h-24 w-24 flex-shrink-0">
                      <Image
                        src={getImageUrl(product)}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    <div className="p-3 flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
                      {/* Ratings commented out as requested */}
                      {/*
                      <div className="flex items-center mt-1">
                        <Star className="h-3 w-3 fill-yellow-400 stroke-yellow-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                          {product.rating || 4.5}
                        </span>
                      </div>
                      */}
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                        {product.description || "No description available"}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatPrice(product.price)}
                        </span>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-full flex items-center"
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-[#1E1E1E] rounded-xl">
              <p className="text-gray-500 dark:text-gray-400">No products available from this restaurant</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Restaurant not found</h2>
          <button
            onClick={() => window.history.back()}
            className="text-red-500 hover:text-red-600"
          >
            Go back
          </button>
        </div>
      )}
    </PageLayout>
  )
} 