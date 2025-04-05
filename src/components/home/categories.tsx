"use client"

// import Link from "next/link"
import { useRouter } from "next/navigation"

type Category = {
  name: string
  emoji: string
}

interface CategoriesProps {
  categories: Category[]
}

export function Categories({ categories = [] }: CategoriesProps) {
  const router = useRouter()
  
  // If no categories are provided, use default ones
  const displayCategories = categories.length > 0 ? categories : [
    { name: "Burger", emoji: "🍔" },
    { name: "Pizza", emoji: "🍕" },
    { name: "Fries", emoji: "🍟" },
    { name: "Drinks", emoji: "🥤" },
    { name: "Salad", emoji: "🥗" },
    { name: "Sushi", emoji: "🍣" },
    { name: "Dessert", emoji: "🍰" },
    { name: "Chicken", emoji: "🍗" },
  ]
  
  const handleCategoryClick = (category: string) => {
    router.push(`/menu?category=${encodeURIComponent(category.toLowerCase())}`)
  }
  
  return (
    <div className="my-6">
      <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Categories</h2>
      
      <div className="flex overflow-x-auto py-2 gap-3 scrollbar-hide">
        {displayCategories.map((category, index) => (
          <button
            key={index}
            onClick={() => handleCategoryClick(category.name)}
            className="flex flex-col items-center justify-center min-w-[70px] py-2 px-3 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-sm border border-gray-100 dark:border-[#333333] hover:border-red-500 dark:hover:border-red-500 transition-colors"
          >
            <span className="text-2xl mb-1">{category.emoji}</span>
            <span className="text-xs text-gray-700 dark:text-gray-300">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
} 