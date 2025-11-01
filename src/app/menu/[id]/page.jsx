"use client"

import { useEffect, useState, useContext, use } from "react"
import { useRouter } from "next/navigation"
import { PageLayout } from "@/components/layout/page-layout"
import { CldImage } from "next-cloudinary"
import { UtensilsCrossed, ArrowLeft, Loader2 } from "lucide-react"
import { LuShoppingCart } from "react-icons/lu"
import { Button } from "@/components/ui/button"
import { motion } from "motion/react"
import { context } from "@/context/contextProvider"
import { useFetchProductByID } from "@/queries/useProducts"
import { useGeolocation } from "@/hooks/useGeoLocation"

export default function ProductDetail({ params }) {
  const router = useRouter()
  const { addToCart } = useContext(context)
  const id = use(params).id
  
  const [sellerName, setSellerName] = useState("")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isVibrating, setIsVibrating] = useState(false)
  const {location} = useGeolocation();
  
  // Fetch product details
  const {data: product, isLoading, isError} = useFetchProductByID(location?.lat, location?.lng, id);
  
  // Image slideshow functionality
  useEffect(() => {
    let intervalId
    
    if (product?.imageUrls && product.imageUrls.length > 1) {
      intervalId = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % product.imageUrls.length)
      }, 5000)
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [product])
  
  const handleAddToCart = () => {
    if (!product) return
    
    const item = {
      id: product.id,
      category: product.category,
      image: (product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : product.imageUrl),
      name: product.name,
      description: product.description,
      price: product.price,
      sellerId: product.sellerId,
      restaurantName: product?.seller?.restaurantName || product?.seller?.username
    }
    
    addToCart(item)
    triggerVibration()
  }
  
  const triggerVibration = () => {
    setIsVibrating(true)
    setTimeout(() => setIsVibrating(false), 500)
  }
  
  // Format price with rupee symbol
  const formatPrice = (price) => {
    return `₹${parseFloat(price).toFixed(2)}`
  }
  
  // Navigation for image gallery
  const goToNextSlide = () => {
    if (!product?.imageUrls || product.imageUrls.length <= 1) return
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % product.imageUrls.length)
  }

  const goToPrevSlide = () => {
    if (!product?.imageUrls || product.imageUrls.length <= 1) return
    setCurrentImageIndex((prevIndex) => prevIndex === 0 ? product.imageUrls.length - 1 : prevIndex - 1)
  }
  
  const goToSlide = (index) => {
    setCurrentImageIndex(index)
  }
  
  // Handle back navigation
  const handleGoBack = () => {
    router.push('/menu')
  }

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Loading product...</h2>
            <Loader2 className="h-12 w-12 animate-spin text-gray-900 dark:text-white mx-auto" />
          </div>
        </div>
      </PageLayout>
    )
  }

  if (isError) {
    setTimeout(()=>{
      router.push('/menu'); // Redirect to menu if product not found
    },1000);

    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-fit border rounded-md text-sm border-red-500 bg-red-200 text-red-500 p-2">
              Error Loading Product
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Redirecting to menu...</p>
            <Loader2 className="h-10 w-10 animate-spin text-gray-900 dark:text-white mx-auto" />
          </div>
        </div>
      </PageLayout>
    )
  }
  
  if (!product) {
    setTimeout(()=>{
      router.back(); // Redirect to menu if product not found
    },1000)
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Product not found OR out of delivery range!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Redirecting to menu...</p>
            <Loader2 className="h-10 w-10 animate-spin text-gray-900 dark:text-white mx-auto" />
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="w-full max-w-4xl mx-auto pb-16">
        {/* Back button */}
        <div className="mb-4">
          <Button 
            onClick={handleGoBack} 
            variant="ghost" 
            className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Menu</span>
          </Button>
        </div>
      
        {/* Product Images Gallery */}
        <div className="relative mb-4 md:mb-6 rounded-2xl overflow-hidden bg-gray-100 bg-opacity-50 dark:bg-gray-900 backdrop-blur-xs shadow-md h-64 sm:h-80 md:h-96">
          {product.imageUrls && product.imageUrls.length > 0 ? (
            <>
              <div 
                className="flex transition-transform duration-500 ease-in-out h-full"
                style={{
                  width: `${product.imageUrls.length * 100}%`,
                  transform: `translateX(-${(currentImageIndex * 100) / product.imageUrls.length}%)`
                }}
              >
                {product.imageUrls.map((url, index) => (
                  <div key={index} className="relative h-full" style={{ width: `${100 / product.imageUrls.length}%` }}>
                    <CldImage 
                      src={url} 
                      alt={`${product.name} - image ${index + 1}`} 
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              
              {product.imageUrls.length > 1 && (
                <>
                  {/* Navigation arrows */}
                  <button 
                    onClick={goToPrevSlide}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-2 z-10"
                    aria-label="Previous image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  
                  <button 
                    onClick={goToNextSlide}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-2 z-10"
                    aria-label="Next image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                  
                  {/* Dots indicator */}
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                    {product.imageUrls.map((_, index) => (
                      <button 
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === currentImageIndex ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : product.imageUrl ? (
            <div className="relative h-full w-full">
              <CldImage 
                src={product.imageUrl} 
                alt={product.name} 
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-[#262626]">
              <UtensilsCrossed className="w-20 h-20 text-gray-400 dark:text-gray-600" />
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-md p-4 md:p-6">
          {/* Name and Seller */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {product.name}
          </h1>
          
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4">
            By {product?.restaurantName }
          </p>
          
          {/* Price and Add to Cart */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="text-2xl font-bold text-orange-500 dark:text-orange-400">
              {formatPrice(product.price)}
            </div>
            
            <motion.button
              animate={{
                rotate: isVibrating ? [0, -5, 5, -5, 5, 0] : 0,
                scale: isVibrating ? 1.1 : 1,
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
              onClick={handleAddToCart}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600"
            >
              <LuShoppingCart className="h-5 w-5" />
            </motion.button>
          </div>

          {/* Categories */}
          {product.categories && Array.isArray(product.categories) && product.categories.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {product.categories.map((category, index) => (
                  <span 
                    key={index}
                    className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Description
            </h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {product.description || "A delicious dish prepared with fresh ingredients."}
            </p>
          </div>
          
          {/* Single category (for backward compatibility) */}
          {product.category && !product.categories && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Category
              </h2>
              <span 
                className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm"
              >
                {product.category}
              </span>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
} 