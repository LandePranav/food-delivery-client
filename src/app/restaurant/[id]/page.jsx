"use client"

import { useState, useEffect, useContext, use, useCallback, useMemo } from "react"
import { CldImage } from "next-cloudinary"
import { Star, Clock, MapPin, Phone, ShoppingCart, UtensilsCrossed, Store } from "lucide-react"
import { PageLayout } from "@/components/layout/page-layout"
import api from "@/lib/axios"
import { context } from "@/context/contextProvider"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

export default function RestaurantDetail({ params }) {
  const { id } = use(params)
  const [restaurant, setRestaurant] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { addToCart, userLocation, getDistanceFromUser } = useContext(context)
  const [distance, setDistance] = useState(null)
  const [vibratingItemId, setVibratingItemId] = useState(null)
  const router = useRouter()
  // Helper function to get the best available image URL - memoized to prevent recalculations
  const getImageUrl = useCallback((item) => {
    if (!item) return ""
    if (item.imageUrl) return item.imageUrl
    if (item.image) return item.image
    if (item.imageUrls && item.imageUrls.length > 0) return item.imageUrls[0]
    return ""
  }, [])
  
  // Format price with rupee symbol - memoized
  const formatPrice = useCallback((price) => {
    return `₹${parseFloat(price).toFixed(2)}`;
  }, []);

  // Memoized function to calculate distance - won't change between renders
  const calculateDistanceFromRestaurant = useCallback(() => {
    if (!restaurant?.gpsLocation || !userLocation || !getDistanceFromUser) return null;
    
    const calculatedDistance = getDistanceFromUser(restaurant.gpsLocation);
    return calculatedDistance;
  }, [restaurant?.gpsLocation, userLocation, getDistanceFromUser]);

  // Combined single useEffect for fetching restaurant data
  useEffect(() => {
    if (!id) return;
    
    const fetchRestaurantData = async () => {
      try {
        setLoading(true)
        
        // Fetch restaurant details
        const restaurantResponse = await api.get(`/sellers/${id}`)
        if (restaurantResponse.status === 200) {
          setRestaurant(restaurantResponse.data)
        }
        
        // Fetch products from this restaurant with user location
        const params = new URLSearchParams()
        params.append('sellerId', id)
        if (userLocation) {
          params.append('lat', userLocation.latitude.toString())
          params.append('lng', userLocation.longitude.toString())
        }
        
        const productsResponse = await api.get(`/products?${params.toString()}`)
        if (productsResponse.status === 200) {
          setProducts(productsResponse.data)
        }
      } catch (error) {
        console.error("Error fetching restaurant data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurantData()
  }, [id, userLocation]); // Re-fetch when ID or user location changes

  // Separate useEffect for distance calculations
  useEffect(() => {
    const newDistance = calculateDistanceFromRestaurant();
    if (newDistance !== null) {
      setDistance(newDistance);
    }
  }, [calculateDistanceFromRestaurant]);

  // Optimized add to cart handler with useCallback to prevent recreation on render
  const handleAddToCart = useCallback((product) => {    
    const item = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: getImageUrl(product),
      sellerId: product.sellerId
    };
    
    // Add item to cart
    addToCart(item);
    
    // Trigger vibration animation
    setVibratingItemId(product.id);
    
    // Clear vibration after animation
    const timeoutId = setTimeout(() => {
      setVibratingItemId(null);
    }, 500);
    
    // No return here since this isn't a cleanup function, it's an event handler
  }, [addToCart, getImageUrl]);

  // Memoized product cards to prevent re-renders
  const productCards = useMemo(() => {
    return products.map((product) => (
      <div 
        key={product.id}
        onClick={() => router.push(`/menu/${product.id}`)}
        className="bg-white cursor-pointer dark:bg-[#1E1E1E] rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-[#333333] hover:shadow-md hover:border-gray-400 hover:dark:border-[#4b4b4b] transition-all duration-500"
      >
        <div className="flex items-center justify-center px-2">
          <div className="relative h-24 w-24 flex-shrink-0 rounded-md items-center justify-center">
            {
              getImageUrl(product) ? (
                <CldImage
                  src={getImageUrl(product)}
                  alt={product.name}
                  width={96}
                  height={96}
                  className="object-cover rounded-md"
                />
              ) : (
                <div className="flex items-center justify-center h-full rounded-md bg-gray-100 dark:bg-[#262626]">
                  <UtensilsCrossed className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                </div>
              )
            }
          </div>
          
          <div className="p-3 flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
              {product.description || "No description available"}
            </p>
            
            <div className="flex items-center justify-between mt-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatPrice(product.price)}
              </span>
              <motion.button
                onClick={() => handleAddToCart(product)}
                type="button"
                className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-2 rounded-lg flex items-center"
                animate={{
                  rotate: vibratingItemId === product.id ? [0, -10, 10, -10, 10, 0] : 0,
                  scale: vibratingItemId === product.id ? 1.15 : 1,
                }}
                transition={{
                  rotate: {
                    type: "tween",
                    duration: 0.5,
                  },
                  scale: {
                    type: "spring",
                    stiffness: 300,
                    damping: 10,
                  }
                }}
              >
                <ShoppingCart className="h-5 w-5 mr-1" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    ));
  }, [products, getImageUrl, formatPrice, handleAddToCart, vibratingItemId]);

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
            {
              (restaurant.imageUrl || restaurant.profile) ? (
                <CldImage
                  src={restaurant.imageUrl || restaurant.profile}
                  alt={restaurant.name}
                  width={1200}
                  height={400}
                  className="object-cover rounded-xl w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full rounded-xl pb-6 bg-gray-100 dark:bg-[#262626]">
                  <Store className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                </div>
              )
            }
            <div className="absolute inset-0 bg-black opacity-40 rounded-xl"></div>
            <div className="absolute bottom-4 left-4 text-white">
              <h1 className="text-xl md:text-2xl font-bold mb-1">{restaurant.restaurantName || restaurant.name}</h1>
              <div className="flex items-center text-sm">
                <span>{restaurant.specialty || "Various"}</span>
              </div>
            </div>
          </div>

          {/* Restaurant Info */}
          <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex flex-col flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-red-500" />
                <span>
                  {restaurant.address || "Address not available"}
                  {distance && <span className="ml-1">({distance.toFixed(1)} km away)</span>}
                </span>
              </div>
              {/* <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-red-500" />
                <span>Open 9:00 AM  10:00 PM</span>
              </div> */}
              {/* <div className="flex items-center">
                <Phone className="h-4 w-4 mr-1 text-red-500" />
                <span>{restaurant.phone || "N/A"}</span>
              </div> */}
            </div>
          </div>

          {/* Products */}
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Menu</h2>
          
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {productCards}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-[#1E1E1E] rounded-xl">
              <p className="text-gray-500 dark:text-gray-400">No products available from this restaurant. <br /> <span className="text-gray-300 font-semibold">AT THIS MOMENT</span></p>
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