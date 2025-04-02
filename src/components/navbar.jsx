"use client";
import { satisfy } from "@/app/fonts";
import Link from "next/link";
import { Button } from "./ui/button";
import {ModeToggle} from "./ui/theme-toggle"
import { LuShoppingCart } from "react-icons/lu";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { context } from "@/context/contextProvider";
import { useRouter } from "next/navigation";
import { GiHamburgerMenu } from "react-icons/gi";
import { motion } from "motion/react";
import { signIn, useSession, signOut } from "next-auth/react";
import UserDropdown from "./common/userDropdown";
import { ShoppingCart, Menu, X, UserCircle2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";

export default function Navbar() {
    const {data: session} = useSession();
    const pathname = usePathname();
    const {cartItems} = useContext(context);
    const [itemCount, setItemCount] = useState(0);
    const router = useRouter();
    const [isVibrating, setIsVibrating] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const triggerVibration = () => {
        setIsVibrating(true);
        setTimeout(()=>setIsVibrating(false),500);
    }

    useEffect(()=>{
        setItemCount(() => {
            return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
        });
        triggerVibration();
    },[cartItems]);

    const links = [
        { href: "/", label: "Home" },
        { href: "/menu", label: "Menu" },
        { href: "/restaurants", label: "Restaurants" },
        { href: "/cart", label: "Cart" },
    ]

    return (
        <>
        <header className="sticky top-0 z-50 bg-white dark:bg-[#1E1E1E] shadow-sm border-b border-gray-200 dark:border-gray-800">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <span className="text-xl font-bold text-red-500">Foodie</span>
                    </Link>
                    
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-8">
                        {links.map(link => (
                            <Link 
                                key={link.href}
                                href={link.href}
                                className={`${
                                    pathname === link.href 
                                        ? "text-red-500 font-medium" 
                                        : "text-gray-700 dark:text-gray-200 hover:text-red-500 dark:hover:text-red-500"
                                } transition-colors`}
                            >
                                {link.label}
                                {link.href === '/cart' && cartItems.length > 0 && (
                                    <motion.span
                                        animate={{
                                            rotate: isVibrating ? [0, -10, 10,-10,10,0] : 0,
                                            scale: isVibrating ? 1.3 : 1,
                                        }}
                                        transition={{ duration: 0.5 }}
                                        className="inline-flex items-center justify-center ml-1 w-5 h-5 text-xs font-medium bg-red-500 text-white rounded-full"
                                    >
                                        {cartItems.length}
                                    </motion.span>
                                )}
                            </Link>
                        ))}
                    </nav>
                    
                    {/* Mobile Navigation Controls */}
                    <div className="flex items-center md:hidden space-x-4">
                        <Link href="/cart" className="text-gray-700 dark:text-gray-200 relative">
                            <ShoppingCart className="h-6 w-6" />
                            {cartItems.length > 0 && (
                                <motion.span
                                    animate={{
                                        rotate: isVibrating ? [0, -10, 10,-10,10,0] : 0,
                                        scale: isVibrating ? 1.3 : 1,
                                    }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-red-500 text-white rounded-full"
                                >
                                    {cartItems.length}
                                </motion.span>
                            )}
                        </Link>
                        
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-gray-700 dark:text-gray-200"
                        >
                            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                    
                    {/* User Profile / Auth */}
                    <div className="hidden md:flex items-center space-x-4">
                        {session ? (
                            <div className="relative group">
                                <button className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-red-500 dark:hover:text-red-500">
                                    <span>{session.user.name.split(' ')[0]}</span>
                                    {session.user.image ? (
                                        <img 
                                            src={session.user.image} 
                                            alt={session.user.name}
                                            className="h-8 w-8 rounded-full"
                                        />
                                    ) : (
                                        <UserCircle2 className="h-8 w-8" />
                                    )}
                                </button>
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1E1E1E] rounded-md shadow-lg border border-gray-200 dark:border-gray-700 invisible group-hover:visible transition-all opacity-0 group-hover:opacity-100">
                                    <div className="py-1">
                                        <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#292929]">
                                            Profile
                                        </Link>
                                        <Link href="/orders" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#292929]">
                                            My Orders
                                        </Link>
                                        <button
                                            onClick={() => signOut()}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#292929]"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Link 
                                href="/api/auth/signin" 
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                            >
                                Sign in
                            </Link>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden overflow-hidden"
                    >
                        <div className="px-4 pt-2 pb-4 space-y-4 bg-white dark:bg-[#1E1E1E] border-t border-gray-200 dark:border-gray-800">
                            {links.filter(link => link.href !== '/cart').map(link => (
                                <Link 
                                    key={link.href}
                                    href={link.href}
                                    className={`block py-2 ${
                                        pathname === link.href 
                                            ? "text-red-500 font-medium" 
                                            : "text-gray-700 dark:text-gray-200"
                                    }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            
                            {session ? (
                                <>
                                    <Link 
                                        href="/profile" 
                                        className="block py-2 text-gray-700 dark:text-gray-200"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Profile
                                    </Link>
                                    <Link 
                                        href="/orders" 
                                        className="block py-2 text-gray-700 dark:text-gray-200"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        My Orders
                                    </Link>
                                    <button
                                        onClick={() => {
                                            signOut()
                                            setIsMobileMenuOpen(false)
                                        }}
                                        className="block w-full text-left py-2 text-gray-700 dark:text-gray-200"
                                    >
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <Link 
                                    href="/api/auth/signin" 
                                    className="block py-2 text-red-500 font-medium"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Sign in
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
        </>
    )
}