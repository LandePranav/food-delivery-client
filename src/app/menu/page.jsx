"use client"
import { useContext, useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { IoSearch, IoFilter } from "react-icons/io5"
import { PageLayout } from "@/components/layout/page-layout"
import Card from "@/components/home/card"
import api from "@/lib/axios"
import { Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Create a separate component for the menu content
function MenuContent() {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get("search")
  const categoryFilter = searchParams.get("category")
  
  const [searchText, setSearchText] = useState(searchQuery || "")
  const [allProducts, setAllProducts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState(categoryFilter || "")
  const [priceFilter, setPriceFilter] = useState(0)
  
  // Categories list
  const categories = [
    { name: "All", emoji: "🍽️" },
    { name: "Burger", emoji: "🍔" },
    { name: "Pizza", emoji: "🍕" },
    { name: "Fries", emoji: "🍟" },
    { name: "Drinks", emoji: "🥤" },
    { name: "Salad", emoji: "🥗" },
    { name: "Sushi", emoji: "🍣" },
    { name: "Dessert", emoji: "🍰" },
    { name: "Chicken", emoji: "🍗" },
  ]

  // Price filter options
  const priceRanges = [
    { value: 0, label: "💰 Price - any" },
    { value: 50, label: "💰 < ₹50 Price" },
    { value: 100, label: "💰 < ₹100 Price" },
    { value: 150, label: "💰 < ₹150 Price" },
    { value: 200, label: "💰 < ₹200 Price" }
  ]

  // Load initial products
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const response = await api.get("/products")
        if (response.status === 200) {
          setAllProducts(response.data)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error fetching products:", error)
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Filter products based on search query, category, and price
  useEffect(() => {
    if (allProducts.length > 0) {
      let result = [...allProducts]
      
      // Apply search filter
      if (searchText) {
        result = result.filter(item => 
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(searchText.toLowerCase()))
        )
      }
      
      // Apply category filter
      if (activeCategory && activeCategory.toLowerCase() !== "all") {
        result = result.filter(item => {
          // Check if categories is an array and contains the active category
          if (Array.isArray(item.categories)) {
            return item.categories.some(cat => 
              cat.toLowerCase() === activeCategory.toLowerCase()
            )
          }
          // For backward compatibility with category as string
          return item.category && item.category.toLowerCase() === activeCategory.toLowerCase()
        })
      }
      
      // Apply price filter
      if (priceFilter > 0) {
        result = result.filter(item => 
          item.price && parseFloat(item.price) <= priceFilter
        )
      }
      
      setFiltered(result)
    }
  }, [searchText, activeCategory, priceFilter, allProducts])

  // Apply URL params when component mounts
  useEffect(() => {
    if (searchQuery) setSearchText(searchQuery)
    if (categoryFilter) setActiveCategory(categoryFilter)
  }, [searchQuery, categoryFilter])

  // Handle price filter change
  const handlePriceFilterChange = (value) => {
    setPriceFilter(Number(value))
  }

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
      <div className="w-full overflow-x-auto py-2 flex gap-2 scrollbar-hide mb-4">
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

      {/* Price Filter Select using shadcn Select component */}
      <div className="mb-4 w-fit">
        <Select 
          value={priceFilter.toString()} 
          onValueChange={handlePriceFilterChange}
        >
          <SelectTrigger className="w-[180px] bg-gray-700 bg-opacity-50 font-semibold text-white border-none focus:ring-0 focus:ring-offset-0">
            <SelectValue placeholder="Select price range" />
          </SelectTrigger>
          <SelectContent>
            {priceRanges.map((range) => (
              <SelectItem key={range.value} value={range.value.toString()}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 dark:text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No products found</p>
        </div>
      ) : (
        <div className="w-full grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-3">
          {filtered.map((item) => (
            <div key={item.id} className="h-full">
              <Card 
                sellerId={item.sellerId} 
                id={item.id} 
                category={item.category} 
                imageUrls={item.imageUrls} 
                imageUrl={item.imageUrl}
                name={item.name} 
                description={item.description} 
                price={item.price} 
              />
            </div>
          ))}
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