"use client"
import Image from "next/image";
import { Button } from "../ui/button";
import { LuShoppingCart } from "react-icons/lu";
import { UtensilsCrossed, Star } from "lucide-react";
import { useContext, useState, useEffect } from "react";
import { context } from "@/context/contextProvider";
import { motion } from "motion/react";
import { CldImage } from "next-cloudinary";

export default function Card({ id, category, image, name, description, price, imageUrls, sellerId, imageUrl }) {
  const {cartItems, addToCart: addItemToCart} = useContext(context);
  const [isVibrating, setIsVibrating] = useState(false);
  const [sellerName, setSellerName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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

  const triggerVibration = () => {
      setIsVibrating(true);
      setTimeout(()=>setIsVibrating(false), 500);
  }

  const handleAddToCart = () => {
    const item = {
      id,
      category,
      image: imageUrl || (imageUrls && imageUrls.length > 0 ? imageUrls[0] : image),
      name,
      description,
      price,
      sellerId
    };
    
    addItemToCart(item);
    triggerVibration();
  }

  // Format price with rupee symbol
  const formatPrice = (price) => {
    return `₹${parseFloat(price).toFixed(2)}`;
  };

  // Get the appropriate image to display
  const getImageToDisplay = () => {
    if (imageUrl) return imageUrl;
    if (imageUrls && imageUrls.length > 0) return imageUrls[0];
    return image;
  }

  return (
    <div className="overflow-hidden border-none shadow-md rounded-2xl dark:bg-[#1E1E1E] dark:text-white bg-white h-full flex flex-col">
      <div className="relative h-40 w-full">
        {(imageUrls && imageUrls.length > 0) || imageUrl ? (
          imageUrls && imageUrls.length > 0 ? (
            <CldImage 
              src={imageUrls[0]} 
              alt={name} 
              width={400}
              height={300}
              className="object-cover w-full h-full"
            />
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
        <div className="absolute top-2 right-2">
          <Button
            onClick={handleAddToCart}
            size="icon"
            className="h-8 w-8 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:bg-orange-500 hover:text-white transition-colors p-1"
          >
            <motion.div
              animate={{
                rotate: isVibrating ? [0, -10, 10, -10, 10, 0] : 0,
                scale: isVibrating ? 1.3 : 1,
              }}
              transition={{
                rotate: {
                  type: "tween",
                  duration: 1,
                },
                scale: {
                  type: "spring",
                  stiffness: 300,
                  damping: 10,
                }
              }}
            >
              <LuShoppingCart className="w-4 h-4" />
            </motion.div>
          </Button>
        </div>
      </div>
      
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-bold text-gray-800 dark:text-white text-sm line-clamp-1">
          {name}
        </h3>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
          {isLoading ? "Loading..." : sellerName}
        </p>
        
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 flex-grow">
          {description || "A delicious dish prepared with fresh ingredients."}
        </p>
        
        <div className="mt-2 flex items-center justify-between">
          <span className="font-bold text-orange-500 dark:text-white">{formatPrice(price)}</span>
          
          <div className="flex items-center">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 dark:fill-gray-400 dark:text-gray-400" />
            <span className="ml-1 text-xs dark:text-gray-300">4.7</span>
          </div>
        </div>
        
        <Button
          onClick={handleAddToCart}
          className="mt-3 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg flex items-center justify-center text-sm"
        >
          Add to Cart
        </Button>
      </div>
    </div>
  );
}