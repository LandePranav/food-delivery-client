"use client"

import { useState, useEffect, useContext } from "react"
import Image from "next/image"
import Link from "next/link"
// import { Star, ShoppingCart, UtensilsCrossed } from "lucide-react"
import { ShoppingCart, UtensilsCrossed } from "lucide-react"
import api from "@/lib/axios"
import { context } from "@/context/contextProvider"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CldImage } from "next-cloudinary"

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
  const [vibratingItemId, setVibratingItemId] = useState<string | null>(null)
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<string, number>>({})
  const [isSwiping, setIsSwiping] = useState<Record<string, boolean>>({})
  const [touchStartX, setTouchStartX] = useState<Record<string, number>>({})
  
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
    if(sellers.length > 0){
      console.log("Sellers fetched successfully")
    }
  }, [sellers])
  
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

  // Image slideshow effect
  useEffect(() => {
    const intervalIds: Record<string, NodeJS.Timeout> = {};
    
    popularItems.forEach(item => {
      if (item.imageUrls && item.imageUrls.length > 1 && !isSwiping[item.id]) {
        intervalIds[item.id] = setInterval(() => {
          setCurrentImageIndices(prev => ({
            ...prev,
            [item.id]: ((prev[item.id] || 0) + 1) % item.imageUrls!.length
          }));
        }, 5000);
      }
    });
    
    return () => {
      Object.values(intervalIds).forEach(id => clearInterval(id));
    };
  }, [popularItems, isSwiping]);

  const handleAddToCart = (item: FoodItem) => {
    const cartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      image: getImageUrl(item),
      sellerId: item.sellerId
    };
    
    addToCart(cartItem);
    
    // Add vibration effect only to the specific item
    setVibratingItemId(item.id);
    setTimeout(() => setVibratingItemId(null), 500);
    
    const audio = new Audio("/notification.mp3")
    audio.play().catch(e => console.log("Audio play failed:", e))
  }

  // Helper function to get the best available image URL
  const getImageUrl = (item: FoodItem): string => {
    if (item.imageUrl) return item.imageUrl
    if (item.image) return item.image
    if (item.imageUrls && item.imageUrls.length > 0) return item.imageUrls[currentImageIndices[item.id] || 0]
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

  // Handle touch events for manual swiping
  const handleTouchStart = (e: React.TouchEvent, itemId: string) => {
    setTouchStartX({...touchStartX, [itemId]: e.touches[0].clientX});
    setIsSwiping({...isSwiping, [itemId]: true});
  };

  const handleTouchMove = (e: React.TouchEvent, itemId: string, imageUrls?: string[]) => {
    if (!isSwiping[itemId] || !imageUrls || imageUrls.length <= 1) return;
  };

  const handleTouchEnd = (e: React.TouchEvent, itemId: string, imageUrls?: string[]) => {
    if (!isSwiping[itemId] || !imageUrls || imageUrls.length <= 1) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchEndX - (touchStartX[itemId] || 0);
    
    // Swipe threshold
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        // Swipe right - go to previous image
        setCurrentImageIndices(prev => ({
          ...prev,
          [itemId]: prev[itemId] === 0 ? imageUrls.length - 1 : (prev[itemId] || 0) - 1
        }));
      } else {
        // Swipe left - go to next image
        setCurrentImageIndices(prev => ({
          ...prev,
          [itemId]: ((prev[itemId] || 0) + 1) % imageUrls.length
        }));
      }
    }
    
    setIsSwiping({...isSwiping, [itemId]: false});
  };

  // Manual navigation functions
  const goToNextSlide = (itemId: string, imageUrls?: string[]) => {
    if (!imageUrls || imageUrls.length <= 1) return;
    setCurrentImageIndices(prev => ({
      ...prev,
      [itemId]: ((prev[itemId] || 0) + 1) % imageUrls.length
    }));
  };

  const goToPrevSlide = (itemId: string, imageUrls?: string[]) => {
    if (!imageUrls || imageUrls.length <= 1) return;
    setCurrentImageIndices(prev => ({
      ...prev,
      [itemId]: prev[itemId] === 0 ? imageUrls.length - 1 : (prev[itemId] || 0) - 1
    }));
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
                <div className="relative h-40 w-full overflow-hidden">
                  {item.imageUrls && item.imageUrls.length > 0 ? (
                    <>
                      <div 
                        className="flex transition-transform duration-500 ease-in-out h-full"
                        style={{ 
                          width: `${item.imageUrls.length * 100}%`,
                          transform: `translateX(-${((currentImageIndices[item.id] || 0) * 100) / item.imageUrls.length}%)`
                        }}
                        onTouchStart={(e) => handleTouchStart(e, item.id)}
                        onTouchMove={(e) => handleTouchMove(e, item.id, item.imageUrls)}
                        onTouchEnd={(e) => handleTouchEnd(e, item.id, item.imageUrls)}
                      >
                        {item.imageUrls.map((url, index) => (
                          <div key={index} className="relative h-full" style={{ width: `${100 / item.imageUrls!.length}%` }}>
                            <CldImage 
                              src={url} 
                              alt={`${item.name} - image ${index + 1}`} 
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      
                      {item.imageUrls.length > 1 && (
                        <>
                          {/* Navigation arrows */}
                          <button 
                            onClick={() => goToPrevSlide(item.id, item.imageUrls)}
                            className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-1 z-10"
                            aria-label="Previous image"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M15 18l-6-6 6-6" />
                            </svg>
                          </button>
                          
                          <button 
                            onClick={() => goToNextSlide(item.id, item.imageUrls)}
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-1 z-10"
                            aria-label="Next image"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </button>
                          
                          {/* Dots indicator */}
                          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
                            {item.imageUrls.map((_, index) => (
                              <button 
                                key={index}
                                onClick={() => setCurrentImageIndices({...currentImageIndices, [item.id]: index})}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  index === (currentImageIndices[item.id] || 0) ? 'w-3 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'
                                }`}
                                aria-label={`Go to image ${index + 1}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : item.imageUrl || item.image ? (
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
                          rotate: vibratingItemId === item.id ? [0, -10, 10, -10, 10, 0] : 0,
                          scale: vibratingItemId === item.id ? 1.3 : 1,
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