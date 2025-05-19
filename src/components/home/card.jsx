"use client"
import Image from "next/image";
import { Button } from "../ui/button";
import { LuShoppingCart } from "react-icons/lu";
import { UtensilsCrossed, Star } from "lucide-react";
import { useContext, useState, useEffect } from "react";
import { context } from "@/context/contextProvider";
import { motion } from "motion/react";
import { CldImage } from "next-cloudinary";
import { useRouter } from "next/navigation";

export default function Card({ id, category, image, name, description, price, imageUrls, sellerId, imageUrl }) {
  const router = useRouter();
  const {cartItems, addToCart: addItemToCart} = useContext(context);
  const [isVibrating, setIsVibrating] = useState(false);
  const [sellerName, setSellerName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  
  // Generate a unique interval time for this card (between 3000 and 7000 ms)
  const [intervalTime] = useState(() => {
    return Math.floor(Math.random() * 4000) + 3000; // Random time between 3-7 seconds
  });

  // Fetch seller name when component mounts
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    
    const fetchSellerName = async () => {
      if (sellerId) {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/sellers/${sellerId}`, { signal });
          if (response.ok) {
            const data = await response.json();
            setSellerName(data.restaurantName || data.name || "Restaurant");
          } else {
            console.log(`Error fetching seller with ID ${sellerId}: ${response.status}`);
            setSellerName("Restaurant");
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error("Error fetching seller name:", error);
            setSellerName("Restaurant");
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        setSellerName("Restaurant");
        setIsLoading(false);
      }
    };
    
    fetchSellerName();
    
    // Clean up function to prevent memory leaks and ongoing requests
    return () => {
      controller.abort();
    };
  }, [sellerId]);
  // Image slideshow effect with unique interval time
  useEffect(() => {
    let intervalId;
    
    if (imageUrls && imageUrls.length > 1 && !isSwiping) {
      // Start the interval with the unique time for this card
      intervalId = setInterval(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imageUrls.length);
      }, intervalTime);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [imageUrls, isSwiping, intervalTime]);

  const triggerVibration = () => {
      setIsVibrating(true);
      setTimeout(()=>setIsVibrating(false), 500);
  }

  const handleAddToCart = (e) => {
    // Stop event propagation to prevent card click
    e.stopPropagation();
    
    const item = {
      id,
      category,
      image: (imageUrls && imageUrls.length > 0 ? imageUrls[0] : "") ,
      name,
      description,
      price,
      sellerId
    };
    
    addItemToCart(item);
    triggerVibration();
  }
  
  const navigateToProductDetail = () => {
    router.push(`/menu/${id}`);
  }

  // Format price with rupee symbol
  const formatPrice = (price) => {
    return `₹${parseFloat(price).toFixed(2)}`;
  };

  // Get the appropriate image to display
  const getImageToDisplay = () => {
    if (imageUrl) return imageUrl;
    if (imageUrls && imageUrls.length > 0) return imageUrls[currentImageIndex];
    return image;
  }

  // Handle touch events for manual swiping
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping || !imageUrls || imageUrls.length <= 1) return;
  };

  const handleTouchEnd = (e) => {
    if (!isSwiping || !imageUrls || imageUrls.length <= 1) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchEndX - touchStartX;
    
    // Swipe threshold
    if (Math.abs(diffX) > 50) {
      if (diffX > 0) {
        // Swipe right - go to previous image
        setCurrentImageIndex((prevIndex) => 
          prevIndex === 0 ? imageUrls.length - 1 : prevIndex - 1
        );
      } else {
        // Swipe left - go to next image
        setCurrentImageIndex((prevIndex) => 
          (prevIndex + 1) % imageUrls.length
        );
      }
    }
    
    setIsSwiping(false);
  };

  // Manual navigation functions
  const goToNextSlide = (e) => {
    e.stopPropagation(); // Prevent card click
    if (!imageUrls || imageUrls.length <= 1) return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imageUrls.length);
  };

  const goToPrevSlide = (e) => {
    e.stopPropagation(); // Prevent card click
    if (!imageUrls || imageUrls.length <= 1) return;
    setCurrentImageIndex((prevIndex) => prevIndex === 0 ? imageUrls.length - 1 : prevIndex - 1);
  };

  return (
    <div 
      className="overflow-hidden border-none shadow-md rounded-2xl dark:bg-[#1E1E1E] dark:text-white bg-white h-full flex flex-col cursor-pointer hover:shadow-lg transition-shadow duration-300"
      onClick={navigateToProductDetail}
    >
      <div className="relative h-40 w-full overflow-hidden">
        {(imageUrls && imageUrls.length > 0) || imageUrl ? (
          imageUrls && imageUrls.length > 0 ? (
            <>
              <div 
                className="flex transition-transform duration-500 ease-in-out h-full"
                style={{ 
                  width: `${imageUrls.length * 100}%`,
                  transform: `translateX(-${(currentImageIndex * 100) / imageUrls.length}%)`
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative h-full" style={{ width: `${100 / imageUrls.length}%` }}>
                    <CldImage 
                      src={url} 
                      alt={`${name} - image ${index + 1}`} 
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              
              {imageUrls.length > 1 && (
                <>
                  {/* Navigation arrows */}
                  <button 
                    onClick={goToPrevSlide}
                    className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-1 z-10"
                    aria-label="Previous image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  
                  <button 
                    onClick={goToNextSlide}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-1 z-10"
                    aria-label="Next image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                  
                  {/* Dots indicator */}
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
                    {imageUrls.map((_, index) => (
                      <button 
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          setCurrentImageIndex(index);
                        }}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          index === currentImageIndex ? 'w-3 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <Image 
              src={getImageToDisplay()}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-[#262626]">
            <UtensilsCrossed className="w-14 h-14 text-gray-400 dark:text-gray-600" />
          </div>
        )}
      </div>
      
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-bold text-gray-800 dark:text-white text-sm line-clamp-1 pb-1">
          {name}
        </h3>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 pb-0.5">
          {isLoading ? "Loading..." : sellerName}
        </p>
        
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 flex-grow">
          {description || "A delicious dish prepared with fresh ingredients."}
        </p>
        
        <div className="mt-2 flex items-center justify-between">
          <span className="font-bold text-md text-orange-500 dark:text-white">{formatPrice(price)}</span>
          
          <motion.button
            animate={{
              rotate: isVibrating ? [0, -10, 10, -10, 10, 0] : 0,
              scale: isVibrating ? 1.2 : 1,
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
            className="rounded-full bg-red-500 p-1.5 text-white hover:bg-orange-600 "
            aria-label="Add to cart"
          >
            <LuShoppingCart className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}