"use client"

import { useState, useEffect, useContext, use, useCallback, useMemo, useRef } from "react"
import { CldImage } from "next-cloudinary"
import { Star, Clock, MapPin, Phone, ShoppingCart, UtensilsCrossed, Store, Search } from "lucide-react"
import { PageLayout } from "@/components/layout/page-layout"
import api from "@/lib/axios"
import { context } from "@/context/contextProvider"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import CustomLoader from "@/components/common/CustomLoader"
import { useFetchRestaurantByID } from "@/queries/useRestaurants"
import { useGeolocation } from "@/hooks/useGeoLocation"
import { useFetchInfiniteProducts } from "@/queries/useProducts"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"

export default function RestaurantDetail({ params }) {
  const { id } = use(params)
  const { addToCart } = useContext(context)
  const [vibratingItemId, setVibratingItemId] = useState(null)
  const {location} = useGeolocation();
  const router = useRouter()
  const loadMoreRef = useRef(null);
  const [searchText, setSearchText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(()=> {
    const searchTimeout = setTimeout(()=>{
      setSearchQuery(searchText)
    },500)
    return () => clearTimeout(searchTimeout);
  }, [searchText])
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

  const {data: restaurant, isLoading: isLoadingRestaurant, isError: isErrorRestaurant} = useFetchRestaurantByID(location?.lat, location?.lng, id);
  const {data: productsData, isLoading: isLoadingProducts, isError: isErrorProducts, hasNextPage, fetchNextPage, isFetchingNextPage} = useFetchInfiniteProducts(location?.lat, location?.lng, searchQuery, 'all', 6, id);
  const products = productsData?.pages.flatMap(page => page.formattedProducts) ?? [];
  
  const ProductCard = ({product}) => {
    return (
      <div 
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
                  fill
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
    )
  }

  useEffect(() => {
    if (!loadMoreRef.current || isFetchingNextPage || !hasNextPage || isLoadingProducts || isLoadingRestaurant) return;
    const observer = new IntersectionObserver((entries)=>{
      if (entries[0].isIntersecting) {
        fetchNextPage();
      }
    });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isLoadingRestaurant, isLoadingProducts]);

  return (
    <PageLayout>
      {isLoadingRestaurant ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <CustomLoader title={"restaurant"} />
        </div>
      ) : restaurant ? (
        <div className="container mx-auto py-4">
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
                  {restaurant.distance && <span className="ml-1">( {isNaN(parseInt(restaurant.distance)) ? '--' : parseInt(restaurant.distance)} km's away )</span> }
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
          <div className="flex flex-col gap-4">
    
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
            <InputGroup>
                  <InputGroupInput
                    type="text"
                    placeholder="Search items..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                  <InputGroupAddon>
                    <Search />
                  </InputGroupAddon>
            </InputGroup>
            {
              isLoadingProducts && (
                <div className="flex items-center justify-center p-8">
                  <CustomLoader title="items" />
                </div>
              )
            }
          
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            ) : (
              
                !isLoadingProducts && (
                  <div className="text-center py-12 bg-white dark:bg-[#1E1E1E] rounded-xl">
                    <p className="text-gray-500 dark:text-gray-400">No products available from this restaurant. <br /> <span className="text-gray-300 font-semibold">AT THIS MOMENT</span></p>
                  </div>

                )
              
            )}

          </div>

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

      {/* Infinite Scroll Trigger */}
      <div 
        ref={loadMoreRef} 
        className="text-muted-foreground flex h-10 justify-center items-center"
      >
        {isFetchingNextPage && (
          <div className="flex justify-center">
            <CustomLoader title="items" />
          </div>
        )}
        {!hasNextPage && products.length > 0 && (
          <div className="w-full text-center py-4">
            <p className="text-gray-500">No more items to load</p>
          </div>
        )}
      </div>
      
    </PageLayout>
  )
} 