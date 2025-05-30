"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Menu, ShoppingCart, 
  // User, 
  Store } from "lucide-react"
import { useContext } from "react"
import { context } from "@/context/contextProvider"

export function BottomNavigation() {
  const pathname = usePathname()
  const { cartItems } = useContext(context)
  
  // Calculate total quantity of items in cart
  const totalCartItems = cartItems.reduce((total: number, item: Record<string, string | number | boolean | Record<string, string>>) => total + (item.quantity as number || 1), 0)

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 bg-white dark:bg-[#1E1E1E] border-t border-gray-200 dark:border-[#333333] shadow-sm items-center justify-around">
      <Link 
        href="/" 
        className={`flex flex-col items-center justify-center w-full h-full ${isActive('/') ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
      >
        <Home className="h-6 w-6" />
        <span className="text-xs mt-1">Home</span>
      </Link>
      
      <Link 
        href="/restaurants" 
        className={`flex flex-col items-center justify-center w-full h-full ${isActive('/restaurants') ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
      >
        <Store className="h-6 w-6" />
        <span className="text-xs mt-1">Restaurant</span>
      </Link>
      
      <Link 
        href="/menu" 
        className={`flex flex-col items-center justify-center w-full h-full ${isActive('/menu') ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
      >
        <Menu className="h-6 w-6" />
        <span className="text-xs mt-1">Menu</span>
      </Link>
      
      
      <Link 
        href="/cart" 
        className={`flex flex-col items-center justify-center w-full h-full relative ${isActive('/cart') ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
      >
        <div className="relative">
          <ShoppingCart className="h-6 w-6" />
          {totalCartItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
              {totalCartItems}
            </span>
          )}
        </div>
        <span className="text-xs mt-1">Cart</span>
      </Link>
      
      {/* <Link 
        href="/profile" 
        className={`flex flex-col items-center justify-center w-full h-full ${isActive('/profile') ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
      >
        <User className="h-6 w-6" />
        <span className="text-xs mt-1">Profile</span>
      </Link> */}
    </div>
  )
} 