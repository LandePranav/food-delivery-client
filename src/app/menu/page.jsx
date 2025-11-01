"use client"
import { useContext, useEffect, useState, Suspense, useRef } from "react"
import { IoSearch, IoFilter } from "react-icons/io5"
import { PageLayout } from "@/components/layout/page-layout"
import Card from "@/components/home/card"
import { Loader2 } from "lucide-react"
import  { useFetchInfiniteProducts} from "@/queries/useProducts"
import { useGeolocation } from "@/hooks/useGeoLocation"
import CustomLoader from "@/components/common/CustomLoader"
import { useSearchParams } from "next/navigation"

// Create a separate component for the menu content
function MenuContent() {
  const {location} = useGeolocation();
  const [searchText, setSearchText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const searchParams = useSearchParams();

  //Update searchtext and category from URL params
  useEffect(() => {
    const searchParam = searchParams.get("search") || ""
    const categoryParam = searchParams.get("category") || "all"
    setSearchText(searchParam)
    setActiveCategory(categoryParam.toLowerCase() === "all" ? "" : categoryParam)
  }, [searchParams])
 
  // Categories list
  const categories = [
    { name: "All", emoji: "🍽️" },
    { name: "Pure-Veg", emoji: "🥬" },
    { name: "Non-Veg", emoji: "🍗" },
    { name: "Specials", emoji: "✨" },
    { name: "Breakfast", emoji: "🍳" },
    { name: "Lunch", emoji: "🍱" },
    { name: "Dinner", emoji: "🍽️" },
    { name: "Drinks/Desserts", emoji: "🍰" },
    { name: "Maharashtrian", emoji: "🫓" },
    { name: "Chinese", emoji: "🥢" },
    { name: "North", emoji: "🍲" },
    { name: "South", emoji: "🥘" },
    { name: "Other", emoji: "🍴" },
  ]
  const loadMoreRef = useRef(null);

  const {data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading} = useFetchInfiniteProducts(location?.lat, location?.lng, searchQuery, activeCategory )

  useEffect(()=> {
    const searchTimeout = setTimeout(()=>{
      setSearchQuery(searchText)
    },500)
    return () => clearTimeout(searchTimeout);
  },[searchText])

    // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !loadMoreRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) fetchNextPage();
    });

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  },[hasNextPage, fetchNextPage])

  const products = data ? data.pages.flatMap(page => page.formattedProducts) : [];


  return (
    <div className="w-full pb-4">
      {/* Search Bar */}
      <div className="w-full flex gap-2 mb-4 px-3 py-2 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm border border-gray-100 dark:border-[#333333] items-center">
        <IoSearch className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <input 
          value={searchText || ""}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search for food..."
          className="w-full bg-transparent cursor-pointer focus:outline-none focus:ring-0 px-1 py-1 text-gray-900 dark:text-gray-100"
        />
      </div>

      {/* Categories */}
      <div className="w-full flex sm:flex-wrap scrollbar-hide py-2 gap-2 mb-4">
        {categories.map((category, index) => (
          <button
            key={index}
            onClick={() => setActiveCategory(index === 0 ? "" : category.name)}
            className={`flex items-center gap-1 min-w-fit py-1 px-3 rounded-full ${
              (index === 0 && !activeCategory) || 
              (activeCategory.toLowerCase() === category.name.toLowerCase())
                ? "bg-red-500 text-white"
                : "bg-white dark:bg-[#1E1E1E] text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-[#333333]"
            }`}
          >
            <span>{category.emoji}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-400" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No products found</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="w-full grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-3">
            {products.map((item) => (
              <div key={item.id} className="h-full cursor-pointer">
                <Card 
                  sellerId={item.sellerId} 
                  id={item.id} 
                  category={item.category} 
                  imageUrls={item.imageUrls} 
                  imageUrl={item.imageUrl}
                  name={item.name} 
                  description={item.description} 
                  price={item.price} 
                  restaurantName={item.restaurantName}
                />
              </div>
            ))}
          </div>

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
              <div className="text-center py-4">
                <p className="text-gray-500">No more items to load</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Main component that wraps MenuContent with Suspense
export default function Menu() {
  return (
    <PageLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-400" />
        </div>
      }>
        <MenuContent />
      </Suspense>
    </PageLayout>
  )
}