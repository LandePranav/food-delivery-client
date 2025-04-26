"use client"

// import Image from "next/image"
import { ChevronLeft, ChevronRight, ShoppingCart, UtensilsCrossed } from "lucide-react"
import {useState, useEffect, useContext } from "react"
import api from "@/lib/axios"
import { context } from "@/context/contextProvider"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { CldImage } from "next-cloudinary"
import { useRouter } from "next/navigation"

interface Dish {
  id: string
  name: string
  price: number
  description: string
  imageUrls: string[]
  categories: string[]
  sellerId: string
  restaurantName?: string
  visible?: boolean
  isFeatured?: boolean
}


export default function SpecialDishesCarousel() {
  const router = useRouter()
  const [specialDishes, setSpecialDishes] = useState<Dish[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const { setCartItems } = useContext(context)
  const [sellerNames, setSellerNames] = useState<Record<string, string>>({})
  const [vibratingItemId, setVibratingItemId] = useState<string | null>(null)
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<string, number>>({})
  const [touchStartX, setTouchStartX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [slideIntervals, setSlideIntervals] = useState<Record<string, number>>({})

  // Number of dishes to display at once based on screen size
  const [itemsToShow, setItemsToShow] = useState(1)

  useEffect(() => {
    const fetchSpecialDishes = async () => {
      try {
        const response = await api.get("/products")
        console.log("Special dishes data:", response.data) // Debug
        if (response.status === 200) {
          // Ensure we have data before setting state
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            console.log("Special dishes data:", response.data) // Debug
            const filteredDishes = response.data.filter((dish: Dish) => dish.isFeatured === true)
            setSpecialDishes(filteredDishes)
            
            // Initialize image indices for each dish
            const initialIndices: Record<string, number> = {}
            const initialIntervals: Record<string, number> = {}
            
            filteredDishes.forEach((dish: Dish) => {
              initialIndices[dish.id] = 0
              // Generate random interval between 5000 and 10000 ms (5-10 seconds)
              initialIntervals[dish.id] = Math.floor(Math.random() * 5000) + 5000
            })
            
            setCurrentImageIndices(initialIndices)
            setSlideIntervals(initialIntervals)
            
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

  // Image slideshow effect
  useEffect(() => {
    const intervalIds: NodeJS.Timeout[] = []
    
    specialDishes.forEach((dish) => {
      if (dish.imageUrls && dish.imageUrls.length > 1 && !isSwiping) {
        const interval = slideIntervals[dish.id] || 5000
        const intervalId = setInterval(() => {
          setCurrentImageIndices((prevIndices) => ({
            ...prevIndices,
            [dish.id]: ((prevIndices[dish.id] || 0) + 1) % dish.imageUrls.length
          }))
        }, interval)
        
        intervalIds.push(intervalId)
      }
    })
    
    return () => {
      intervalIds.forEach(id => clearInterval(id))
    }
  }, [specialDishes, isSwiping, slideIntervals])

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
    setVibratingItemId(dish.id)
    setTimeout(() => setVibratingItemId(null), 500)
  }

  // Helper function to get the best available image URL
  const getImageUrl = (item: Dish) => {
    if (item.imageUrls && item.imageUrls.length > 0) {
      const currentIndex = currentImageIndices[item.id] || 0
      return item.imageUrls[currentIndex]
    }
    return "/placeholder.jpg"
  }

  const getSellerName = (sellerId?: string) => {
    if (!sellerId) return "Unknown Restaurant"
    return sellerNames[sellerId] || "Unknown Restaurant"
  }

  // Handle touch events for manual swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
    setIsSwiping(true)
  }

  const handleTouchMove = () => {
    if (!isSwiping) return
  }

  const handleTouchEnd = (e: React.TouchEvent, dishId: string) => {
    if (!isSwiping) return
    
    const dish = specialDishes.find(d => d.id === dishId)
    if (!dish || !dish.imageUrls || dish.imageUrls.length <= 1) return
    
    const touchEndX = e.changedTouches[0].clientX
    const diffX = touchEndX - touchStartX
    
    // Swipe threshold
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        // Swipe right - go to previous image
        setCurrentImageIndices(prev => ({
          ...prev,
          [dishId]: prev[dishId] === 0 ? dish.imageUrls.length - 1 : prev[dishId] - 1
        }))
      } else {
        // Swipe left - go to next image
        setCurrentImageIndices(prev => ({
          ...prev,
          [dishId]: (prev[dishId] + 1) % dish.imageUrls.length
        }))
      }
    }
    
    setIsSwiping(false)
  }

  // Manual navigation functions
  const goToNextSlide = (dishId: string) => {
    const dish = specialDishes.find(d => d.id === dishId)
    if (!dish || !dish.imageUrls || dish.imageUrls.length <= 1) return
    
    setCurrentImageIndices(prev => ({
      ...prev,
      [dishId]: (prev[dishId] + 1) % dish.imageUrls.length
    }))
  }

  const goToPrevSlide = (dishId: string) => {
    const dish = specialDishes.find(d => d.id === dishId)
    if (!dish || !dish.imageUrls || dish.imageUrls.length <= 1) return
    
    setCurrentImageIndices(prev => ({
      ...prev,
      [dishId]: prev[dishId] === 0 ? dish.imageUrls.length - 1 : prev[dishId] - 1
    }))
  }

  // Function to navigate to product detail page
  const navigateToProductDetail = (id: string) => {
    router.push(`/menu/${id}`)
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
    <div className="my-6 md:my-8">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Featured Special Dishes</h2>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : specialDishes.length > 0 ? (
        <div className="relative">
          {/* Previous slide button */}
          <button 
            onClick={prevSlide}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-[#262626] shadow-md p-1.5 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#333333] border border-gray-200 dark:border-[#444444]"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          
          {/* Carousel */}
          <div className="overflow-hidden my-2">
            <div className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(${-currentIndex * (100 / itemsToShow)}%)`,
                width: `${specialDishes.length * (100 / itemsToShow)}%`
              }}
            >
              {specialDishes.map((dish) => (
                <div 
                  key={dish.id} 
                  className="flex-shrink-0 px-2" 
                  style={{ width: `${100 / specialDishes.length * itemsToShow}%` }}
                >
                  <div 
                    className="overflow-hidden border-none shadow-md rounded-2xl dark:bg-[#1E1E1E] dark:text-white bg-white h-full flex flex-col cursor-pointer hover:shadow-lg transition-shadow duration-300"
                    onClick={() => navigateToProductDetail(dish.id)}
                  >
                    <div className="relative h-40 w-full overflow-hidden">
                      {dish.imageUrls && dish.imageUrls.length > 0 ? (
                        <>
                          <div 
                            className="flex transition-transform duration-500 ease-in-out h-full"
                            style={{ 
                              width: `${dish.imageUrls.length * 100}%`,
                              transform: `translateX(-${((currentImageIndices[dish.id] || 0) * 100) / dish.imageUrls.length}%)`
                            }}
                            onTouchStart={(e) => handleTouchStart(e)}
                            onTouchMove={() => handleTouchMove()}
                            onTouchEnd={(e) => handleTouchEnd(e, dish.id)}
                          >
                            {dish.imageUrls.map((url, index) => (
                              <div key={index} className="relative h-full" style={{ width: `${100 / dish.imageUrls.length}%` }}>
                                <CldImage 
                                  src={url} 
                                  alt={`${dish.name} - image ${index + 1}`} 
                                  fill
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  className="object-cover"
                                />
                              </div>
                            ))}
                          </div>
                          
                          {dish.imageUrls.length > 1 && (
                            <>
                              {/* Navigation arrows */}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click
                                  goToPrevSlide(dish.id);
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
                                  goToNextSlide(dish.id);
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
                                {dish.imageUrls.map((_, index) => (
                                  <button 
                                    key={index}
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent card click
                                      setCurrentImageIndices({...currentImageIndices, [dish.id]: index})
                                    }}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                      index === (currentImageIndices[dish.id] || 0) ? 'w-3 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'
                                    }`}
                                    aria-label={`Go to image ${index + 1}`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-[#262626]">
                          <UtensilsCrossed className="w-14 h-14 text-gray-400 dark:text-gray-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 flex-1 flex flex-col dark:bg-[#1E1E1E]">
                      <h3 className="font-bold text-gray-800 dark:text-white text-sm line-clamp-1">{dish.name}</h3>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{getSellerName(dish.sellerId)}</p>
                      
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-bold text-orange-500 dark:text-white">₹ {dish.price?.toFixed(2) || "0.00"}</span>
                        
                        <Button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click
                            handleAddToCart(dish)
                          }}
                          size="icon"
                          className="h-8 w-8 rounded-full bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
                        >
                          <motion.div
                            animate={{
                              rotate: vibratingItemId === dish.id ? [0, -10, 10, -10, 10, 0] : 0,
                              scale: vibratingItemId === dish.id ? 1.3 : 1,
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
          
          {/* Next slide button */}
          <button 
            onClick={nextSlide}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-[#262626] shadow-md p-1.5 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#333333] border border-gray-200 dark:border-[#444444]"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      ) : (
        <div className="flex justify-center items-center py-8 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm">
          <p className="text-gray-500 dark:text-gray-400">No featured dishes available</p>
        </div>
      )}
    </div>
  )
} 