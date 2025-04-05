"use client"

import Image from "next/image"
import { ChevronLeft, ChevronRight, ShoppingCart} from "lucide-react"
import {useState, useEffect, useContext } from "react"
import api from "@/lib/axios"
import { context } from "@/context/contextProvider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface Dish {
  id: string
  name: string
  price: number
  description?: string
  image?: string
  imageUrl?: string
  imageUrls?: string[]
  sellerId?: string
  categoryId?: string
  rating?: number
}


export default function SpecialDishesCarousel() {
  const [specialDishes, setSpecialDishes] = useState<Dish[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const { setCartItems } = useContext(context)
  const [sellerNames, setSellerNames] = useState<Record<string, string>>({})
  const [isVibrating, setIsVibrating] = useState(false)

  // Number of dishes to display at once based on screen size
  const [itemsToShow, setItemsToShow] = useState(1)

  useEffect(() => {
    const fetchSpecialDishes = async () => {
      try {
        const response = await api.get("/products?limit=8")
        if (response.status === 200) {
          // Ensure we have data before setting state
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            console.log("Special dishes data:", response.data) // Debug
            setSpecialDishes(response.data)
            
            // Get unique seller IDs
            const sellerIds = [...new Set(response.data
              .filter((dish: Dish) => dish.sellerId)
              .map((dish: Dish) => dish.sellerId))]
            
            // Fetch seller names if we have seller IDs
            if (sellerIds.length > 0) {
              try {
                const sellersResponse = await api.get("/sellers")
                if (sellersResponse.status === 200) {
                  const sellersMap: Record<string, string> = {}
                  
                  sellersResponse.data.forEach((seller: Record<string, string | number | boolean | Record<string, string>>) => {
                    if (sellerIds.includes(seller.id as string)) {
                      sellersMap[seller.id as string] = (seller.restaurantName as string) || (seller.name as string) || "Unknown Restaurant"
                    }
                  })
                  
                  setSellerNames(sellersMap)
                }
              } catch (error) {
                console.error("Error fetching sellers:", error)
              }
            }
          } else {
            console.error("No special dishes data received:", response.data)
            setSpecialDishes([])
          }
        }
      } catch (error) {
        console.error("Error fetching special dishes:", error)
        setSpecialDishes([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchSpecialDishes()

    // Update itemsToShow based on window width
    const updateItemsToShow = () => {
      if (window.innerWidth >= 1024) {
        setItemsToShow(3)
      } else if (window.innerWidth >= 768) {
        setItemsToShow(2)
      } else {
        setItemsToShow(1)
      }
    }

    // Set initial value
    updateItemsToShow()

    // Add event listener for window resize
    window.addEventListener("resize", updateItemsToShow)

    // Clean up
    return () => window.removeEventListener("resize", updateItemsToShow)
  }, [])

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? Math.max(0, specialDishes.length - itemsToShow) : prevIndex - 1
    )
  }

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex >= specialDishes.length - itemsToShow ? 0 : prevIndex + 1
    )
  }

  const handleAddToCart = (dish: Dish) => {
    const item = {
      id: dish.id,
      name: dish.name,
      price: dish.price,
      image: getImageUrl(dish),
      sellerId: dish.sellerId
    };
    
    setCartItems((prev: Dish[]) => [...prev, item])
    setIsVibrating(true)
    setTimeout(() => setIsVibrating(false), 500)
  }

  // Helper function to get the best available image URL
  const getImageUrl = (item: Dish) => {
    if (item.imageUrl) return item.imageUrl
    if (item.image) return item.image
    if (item.imageUrls && item.imageUrls.length > 0) return item.imageUrls[0]
    return "/placeholder.jpg"
  }

  const getSellerName = (sellerId?: string) => {
    if (!sellerId) return "Unknown Restaurant"
    return sellerNames[sellerId] || "Unknown Restaurant"
  }

  if (loading) {
    return (
      <div className="my-6 px-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Special Dishes</h2>
          </div>
          <div className="flex justify-center items-center h-48 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    )
  }

  if (specialDishes.length === 0) {
    return (
      <div className="my-6 px-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Special Dishes</h2>
          </div>
          <div className="flex justify-center items-center h-48 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm">
            <p className="text-gray-500 dark:text-gray-400">No special dishes found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="my-6 px-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">Special Dishes</h2>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)` }}
            >
              {specialDishes.map((dish) => (
                <div 
                  key={dish.id} 
                  className="flex-none p-2"
                  style={{ width: `${100 / itemsToShow}%` }}
                >
                  <div className="overflow-hidden border-none shadow-md rounded-2xl dark:bg-[#1E1E1E] dark:text-white bg-white h-full flex flex-col">
                    <div className="relative h-48 w-full">
                      {getImageUrl(dish) !== "/placeholder.jpg" ? (
                        <Image 
                          src={getImageUrl(dish)}
                          alt={dish.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                          priority={currentIndex === 0}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-[#262626]">
                          <ShoppingCart className="h-10 w-10 text-gray-400 dark:text-gray-600" />
                        </div>
                      )}
                      {dish.price > 15 && (
                        <Badge className="absolute bottom-2 left-2 bg-orange-500 dark:bg-[#333333] hover:bg-orange-600 dark:hover:bg-[#444444] text-white">
                          Premium
                        </Badge>
                      )}
                    </div>
                    
                    <div className="p-3 flex-1 flex flex-col dark:bg-[#1E1E1E]">
                      <h3 className="font-bold text-gray-800 dark:text-white text-sm line-clamp-1">{dish.name}</h3>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{getSellerName(dish.sellerId)}</p>
                      
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-bold text-orange-500 dark:text-white">${dish.price?.toFixed(2) || "0.00"}</span>
                        
                        <Button
                          onClick={() => handleAddToCart(dish)}
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
          </div>
          
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 bg-white dark:bg-[#333333] rounded-full p-2 shadow-md hover:bg-gray-100 dark:hover:bg-[#444444] focus:outline-none z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5 text-gray-900 dark:text-white" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2 bg-white dark:bg-[#333333] rounded-full p-2 shadow-md hover:bg-gray-100 dark:hover:bg-[#444444] focus:outline-none z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5 text-gray-900 dark:text-white" />
          </button>
        </div>
      </div>
    </div>
  )
} 