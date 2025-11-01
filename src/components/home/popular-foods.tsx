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
import { CldImage } from "next-cloudinary"
import { useRouter } from "next/navigation"

interface FoodItem {
  id: string
  name: string
  restaurant?: string
  restaurantName?: string
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

// Seller interface removed; we no longer fetch sellers here

interface PopularFoodsProps {
  items?: FoodItem[]
  limit?: number
}

export default function PopularFoods({ items=[]}: PopularFoodsProps) {
  const router = useRouter()
  const popularItems = items
  const { addToCart} = useContext(context)
  const [vibratingItemId, setVibratingItemId] = useState<string | null>(null)
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<string, number>>({})
  const [isSwiping, setIsSwiping] = useState<Record<string, boolean>>({})
  const [touchStartX, setTouchStartX] = useState<Record<string, number>>({})
  const [slideIntervals, setSlideIntervals] = useState<Record<string, number>>({})
  
  // Generate random intervals for each item when they are loaded
  useEffect(() => {
    const intervals: Record<string, number> = {};
    
    popularItems.forEach(item => {
      if (item.imageUrls && item.imageUrls.length > 1) {
        // Generate a random interval between 5000ms (5s) and 10000ms (10s)
        intervals[item.id] = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
      }
    });
    
    setSlideIntervals(intervals);
  }, [popularItems]);

  // Image slideshow effect with different intervals for each card
  useEffect(() => {
    const intervalIds: Record<string, NodeJS.Timeout> = {};
    
    popularItems.forEach(item => {
      if (item.imageUrls && item.imageUrls.length > 1 && !isSwiping[item.id]) {
        const interval = slideIntervals[item.id] || 5000; // Default to 5000 if not set
        
        intervalIds[item.id] = setInterval(() => {
          setCurrentImageIndices(prev => ({
            ...prev,
            [item.id]: ((prev[item.id] || 0) + 1) % item.imageUrls!.length
          }));
        }, interval);
      }
    });
    
    return () => {
      Object.values(intervalIds).forEach(id => clearInterval(id));
    };
  }, [popularItems, isSwiping, slideIntervals]);

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
  const getSellerName = (item: FoodItem) => item.restaurantName || "Restaurant"
  
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
  
  // Function to navigate to product detail page
  const navigateToProductDetail = (id: string) => {
    router.push(`/menu/${id}`)
  }

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

        
      {
        popularItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularItems.map((item) => (
            <div key={item.id} className="h-full">
              <div 
                className="overflow-hidden border-none shadow-md rounded-2xl dark:bg-[#1E1E1E] dark:text-white bg-white h-full flex flex-col cursor-pointer hover:shadow-lg transition-shadow duration-300"
                onClick={() => navigateToProductDetail(item.id)}
              >
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
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click
                              goToPrevSlide(item.id, item.imageUrls);
                            }}
                            className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-1 z-10"
                            aria-label="Previous image"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M15 18l-6-6 6-6" />
                            </svg>
                          </button>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click
                              goToNextSlide(item.id, item.imageUrls);
                            }}
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
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click
                                  setCurrentImageIndices({...currentImageIndices, [item.id]: index});
                                }}
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
                
                <div className="p-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-medium text-md">{item.name}</h3>

                    
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 pb-1 text-muted-foreground">
                      {getSellerName(item)}
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-1">
                      {item.description || "Delicious food item from our menu"}
                    </p>
                    
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div>
                      <span className="flex items-center text-md font-semibold">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                    
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        handleAddToCart(item);
                      }}
                      aria-label="Add to cart"
                      className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white p-1.5 rounded-full shadow-sm"
                      animate={{
                        rotate: vibratingItemId === item.id ? [0, -10, 10, -10, 10, 0] : 0,
                        scale: vibratingItemId === item.id ? 1.2 : 1,
                      }}
                      transition={{
                        duration: 0.5,
                        ease: "easeInOut",
                      }}
                    >
                      <ShoppingCart className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center py-8 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm">
          <p className="text-gray-500 dark:text-gray-400">No popular foods available</p>
        </div>
      )}
    </div>
  )
} 