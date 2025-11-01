"use client"

import { useState, useEffect, useContext, useRef, useMemo } from "react"
import { context } from "@/context/contextProvider"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { CldImage } from "next-cloudinary"
import { useRouter } from "next/navigation"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { UtensilsCrossed, ShoppingCart } from "lucide-react"
import { useFetchInfiniteProducts } from "@/queries/useProducts"
import { useGeolocation } from "@/hooks/useGeoLocation"

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
  const [vibratingItemId, setVibratingItemId] = useState<string | null>(null)
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<string, number>>({})
  const slideIntervalsRef = useRef<Record<string, number>>({})
  const { setCartItems } = useContext(context)

  const {location} = useGeolocation();
  const {data: productResponse, isLoading} = useFetchInfiniteProducts(
    location?.lat, 
    location?.lng, 
    "", 
    "all", 
    20, 
    '', 
    {featured: "true"}
  );

  // Memoize the products array
  const products = useMemo(() => 
    productResponse ? productResponse.pages.flatMap(page => page.formattedProducts) : []
  , [productResponse]);

  // Initialize image indices and intervals only once when products change
  useEffect(() => {
    if (!products.length) return;

    const newIndices: Record<string, number> = {};
    products.forEach((dish: Dish) => {
      if (!(dish.id in currentImageIndices)) {
        newIndices[dish.id] = 0;
        slideIntervalsRef.current[dish.id] = Math.floor(Math.random() * 5000) + 5000;
      }
    });

    if (Object.keys(newIndices).length > 0) {
      setCurrentImageIndices(prev => ({...prev, ...newIndices}));
    }
  }, [products]);

  // Image slideshow effect
  useEffect(() => {
    if (!products.length) return;
    
    const intervalIds = new Map<string, NodeJS.Timeout>();
    
    products.forEach((dish) => {
      if (dish.imageUrls?.length > 1) {
        const interval = slideIntervalsRef.current[dish.id] || 5000;
        const intervalId = setInterval(() => {
          setCurrentImageIndices(prev => ({
            ...prev,
            [dish.id]: ((prev[dish.id] || 0) + 1) % dish.imageUrls.length
          }));
        }, interval);
        
        intervalIds.set(dish.id, intervalId);
      }
    });
    
    return () => intervalIds.forEach(id => clearInterval(id));
  }, [products]);

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

  const getSellerName = (dish: Dish) => dish.restaurantName || "Unknown Restaurant"

  // Function to navigate to product detail page
  const navigateToProductDetail = (id: string) => {
    router.push(`/menu/${id}`)
  }

  if (isLoading) {
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

  if (!products.length) {
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
      
      <Carousel>
        <CarouselContent className="-ml-4">
          {products.map((dish) => (
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
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{getSellerName(dish)}</p>
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
    </div>
  )
}