"use client"

import {useState, useRef, useEffect } from "react"
// import {useContext} from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MapPin, Search, 
  // ShoppingCart, 
  X } from "lucide-react"
import { useSession } from "next-auth/react"
// import { context } from "@/context/contextProvider"
import { satisfy } from "@/app/fonts"
// import UserDropdown from "@/components/common/userDropdown"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar"

export function Header() {
  const { data: session } = useSession()
  // const { cartItems } = useContext(context)
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Calculate total quantity of items in cart
  // const totalCartItems = cartItems.reduce((total: number, item: Record<string, string | number | boolean | Record<string, string>>) => total + (item.quantity as number || 1), 0)
  
  // Focus the search input when the search bar is opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchOpen])
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/menu?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
    }
  }
  
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#121212] py-4 px-4 md:px-8 border-b border-gray-200 dark:border-[#333333]">
      {searchOpen ? (
        <form 
          onSubmit={handleSearch}
          className="flex items-center justify-between w-full animate-slide-up"
        >
          <div className="flex-1 flex items-center bg-gray-100 dark:bg-[#333333] rounded-full px-4 py-2">
            <Search className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for food, restaurants..."
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            type="button"
            className="ml-2 p-2 text-gray-500 dark:text-gray-400"
            onClick={() => setSearchOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </form>
      ) : (
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className={satisfy.className + " text-2xl md:text-3xl font-bold text-gray-900 dark:text-white"}>
            {/* Wake <span className="text-red-500 px-1">N</span> Bake */}
            <span className="text-red-500 px-1">B</span>ites
          </Link>
          
          {/* Location */}
          <div className="hidden md:flex items-center text-sm">
            <MapPin className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-gray-600 dark:text-gray-300">PUNE, IN</span>
          </div>

          {/* Search and Cart */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-full bg-gray-100 dark:bg-[#333333] text-gray-700 dark:text-gray-300"
            >
              <Search className="h-5 w-5 md:h-6 md:w-6" />
            </button>
            
            {/* <Link href="/cart" className="relative">
              <ShoppingCart className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  {totalCartItems}
                </span>
              )}
            </Link> */}
            
            {session ? (
              // <UserDropdown />
              <Link href={"/profile"} className="flex gap-2 px-1 md:px-3 items-center cursor-pointer">
                  <Avatar>
                      <AvatarImage className="rounded-full md:w-full md:h-full w-8 h-8 my-auto mx-auto" src={session?.user?.image} />
                      <AvatarFallback className="bg-red-500">
                          {session?.user?.name?.charAt(0)}
                      </AvatarFallback>
                  </Avatar>
                  <p className="text-center text-nowrap hidden sm:block">
                      {session?.user?.name}
                  </p>
                  {/* <ChevronDown className="w-4 h-4 hidden sm:block" /> */}
              </Link>
            ) : (
              <Link
                href="/api/auth/signin"
                className="hidden md:block px-3 py-1.5 bg-red-500 text-white text-smp font-medium rounded-full hover:bg-red-600"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}