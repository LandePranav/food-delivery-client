"use client"

// import Image from "next/image"
// import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect, useContext } from "react"
import api from "@/lib/axios"
import { context } from "@/context/contextProvider"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { CldImage } from "next-cloudinary"
import { useRouter } from "next/navigation"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { UtensilsCrossed, ShoppingCart } from "lucide-react"

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
  const [slideIntervals, setSlideIntervals] = useState<Record<string, number>>({})
  const [slidesPerView, setSlidesPerView] = useState(1)

  // Calculate card width based on slidesPerView
  const cardWidth = 100 / slidesPerView
  const gapWidth = 4 // 1rem gap
  const totalWidth = specialDishes.length * (cardWidth + gapWidth)

  // Debug logging
  useEffect(() => {
    console.log({
      currentIndex,
      cardWidth,
      gapWidth,
      totalWidth,
      transform: -(cardWidth * currentIndex)
    })
  }, [currentIndex, cardWidth, gapWidth, totalWidth])

  useEffect(() => {
    const fetchSpecialDishes = async () => {
      try {
        const response = await api.get("/products")
        if (response.status === 200) {
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            const filteredDishes = response.data.filter((dish: Dish) => dish.isFeatured === true)
            setSpecialDishes(filteredDishes)
            
            // Initialize image indices for each dish
            const initialIndices: Record<string, number> = {}
            const initialIntervals: Record<string, number> = {}
            
            filteredDishes.forEach((dish: Dish) => {
              initialIndices[dish.id] = 0
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

    // Update responsive behavior
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg
        setSlidesPerView(3)
      } else if (window.innerWidth >= 768) { // md
        setSlidesPerView(2)
      } else {
        setSlidesPerView(1)
      }
      // Reset to first slide when resizing to avoid blank spaces
      setCurrentIndex(0)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Image slideshow effect
  useEffect(() => {
    const intervalIds: NodeJS.Timeout[] = []
    
    specialDishes.forEach((dish) => {
      if (dish.imageUrls && dish.imageUrls.length > 1) {
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
  }, [specialDishes, slideIntervals])

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
    <div className="my-6 md:my-8 px-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Featured Special Dishes</h2>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      ) : specialDishes.length > 0 ? (
        <Carousel>
          <CarouselContent className="-ml-4">
            {specialDishes.map((dish) => (
              <CarouselItem key={dish.id} className="pl-4 md:basis-1/2 lg:basis-1/3"  >
                <div 
                  className="overflow-hidden border-none shadow-md rounded-2xl dark:bg-[#1E1E1E] dark:text-white bg-white h-full flex flex-col cursor-pointer hover:shadow-lg transition-shadow duration-300"
                  onClick={() => navigateToProductDetail(dish.id)}
                >
                  <div className="relative h-40 w-full overflow-hidden">
                    {dish.imageUrls && dish.imageUrls.length > 0 ? (
                      <CldImage 
                        src={getImageUrl(dish)} 
                        alt={`${dish.name}`} 
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
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
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      ) : (
        <div className="flex justify-center items-center py-8 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm">
          <p className="text-gray-500 dark:text-gray-400">No featured dishes available</p>
        </div>
      )}
    </div>
  )
} 