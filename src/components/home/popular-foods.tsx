"use client"

import { useState, useEffect, useContext } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, ShoppingCart, UtensilsCrossed } from "lucide-react"
import api from "@/lib/axios"
import { context } from "@/context/contextProvider"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface FoodItem {
  id: string
  name: string
  restaurant?: string
  sellerId?: string
  price: number
  rating?: number
  description?: string
  image?: string
  imageUrl?: string
  imageUrls?: string[]
  discount?: string
  categoryId?: string
}

interface Seller {
  id: string
  name: string
  restaurantName?: string
  specialty?: string
}

interface PopularFoodsProps {
  items?: FoodItem[]
  limit?: number
}

export default function PopularFoods({ items = [], limit = 4 }: PopularFoodsProps) {
  const [popularItems, setPopularItems] = useState<FoodItem[]>(items)
  const { addToCart } = useContext(context)
  const [loading, setLoading] = useState(true)
  const [sellerNames, setSellerNames] = useState<Record<string, string>>({})
  const [sellers, setSellers] = useState<Seller[]>([])
  const [isVibrating, setIsVibrating] = useState(false)
  
  // Fetch sellers on component mount (only once)
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await api.get("/sellers")
        if (response.status === 200 && Array.isArray(response.data)) {
          setSellers(response.data)
          
          // Create a mapping of seller IDs to names
          const namesMap: Record<string, string> = {}
          response.data.forEach((seller: Seller) => {
            namesMap[seller.id] = seller.restaurantName || seller.name || "Unknown Restaurant"
          })
          
          setSellerNames(namesMap)
        }
      } catch (error) {
        console.error("Error fetching sellers:", error)
      }
    }
    
    fetchSellers()
  }, [])
  
  useEffect(() => {
    if (items.length > 0) {
      setPopularItems(items.slice(0, limit))
      setLoading(false)
    } else {
      const fetchPopularItems = async () => {
        try {
          const response = await api.get("/products?sort=popularity&limit=" + limit)
          if (response.status === 200) {
            setPopularItems(response.data)
          }
        } catch (error) {
          console.error("Error fetching popular items:", error)
        } finally {
          setLoading(false)
        }
      }
      
      fetchPopularItems()
    }
  }, [items, limit])

  const handleAddToCart = (item: FoodItem) => {
    const cartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      image: getImageUrl(item),
      sellerId: item.sellerId
    };
    
    addToCart(cartItem);
    
    // Add vibration effect
    setIsVibrating(true);
    setTimeout(() => setIsVibrating(false), 500);
    
    const audio = new Audio("/notification.mp3")
    audio.play().catch(e => console.log("Audio play failed:", e))
  }

  // Helper function to get the best available image URL
  const getImageUrl = (item: FoodItem): string => {
    if (item.imageUrl) return item.imageUrl
    if (item.image) return item.image
    if (item.imageUrls && item.imageUrls.length > 0) return item.imageUrls[0]
    return "/placeholder.jpg"
  }
  
  // Helper function to get seller name
  const getSellerName = (sellerId?: string) => {
    if (!sellerId) return "Restaurant"
    return sellerNames[sellerId] || "Restaurant"
  }
  
  // Format price with rupee symbol
  const formatPrice = (price: number): string => {
    return `₹${price.toFixed(2)}`;
  };
  
  return (
    <div className="my-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Popular Foods</h2>
        <Link 
          href="/menu" 
          className="text-sm text-orange-500 dark:text-orange-400 font-medium hover:underline"
        >
          See All
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-8 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : popularItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularItems.map((item) => (
            <div key={item.id} className="h-full">
              <div className="overflow-hidden border-none shadow-md rounded-2xl dark:bg-[#1E1E1E] dark:text-white bg-white h-full flex flex-col">
                <div className="relative h-40 w-full">
                  {getImageUrl(item) !== "/placeholder.jpg" ? (
                    <Image
                      src={getImageUrl(item)}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-[#262626]">
                      <UtensilsCrossed className="w-14 h-14 text-gray-400 dark:text-gray-600" />
                    </div>
                  )}
                  {item.discount && (
                    <Badge className="absolute bottom-2 left-2 bg-orange-500 dark:bg-[#333333] hover:bg-orange-600 dark:hover:bg-[#444444] text-white">
                      {item.discount}
                    </Badge>
                  )}
                </div>
                
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-bold text-gray-800 dark:text-white text-sm line-clamp-1">
                    {item.name}
                  </h3>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                    {getSellerName(item.sellerId)}
                  </p>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 flex-grow">
                    {item.description || "A delicious dish prepared with fresh ingredients."}
                  </p>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold text-orange-500 dark:text-white">{formatPrice(item.price || 0)}</span>
                    
                    <Button
                      onClick={() => handleAddToCart(item)}
                      size="icon"
                      className="h-8 w-8 rounded-full bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
                    >
                      <motion.div
                        animate={{
                          rotate: isVibrating ? [0, -10, 10, -10, 10, 0] : 0,
                          scale: isVibrating ? 1.3 : 1,
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
                        <ShoppingCart className="w-4 h-4" />
                      </motion.div>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm">
          <p className="text-gray-500 dark:text-gray-400">No popular foods available right now.</p>
        </div>
      )}
    </div>
  )
} 