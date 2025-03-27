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
import { signIn, useSession } from "next-auth/react";
import UserDropdown from "./common/userDropdown";

export default function Navbar() {
    const {data: session} = useSession();
    const pathname = usePathname();
    const {cartItems} = useContext(context);
    const [itemCount, setItemCount] = useState(0);
    const router = useRouter();
    const [isVibrating, setIsVibrating] = useState(false);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    const triggerVibration = () => {
        setIsVibrating(true);
        setTimeout(()=>setIsVibrating(false),500);
    }

    useEffect(()=>{
        setItemCount(()=>{
            return cartItems.length;
        });
        triggerVibration();
    },[cartItems]);

    return (
        <>
        <nav className="w-full sticky flex items-center justify-between pb-4 md:pb-10">
            <h2 onClick={()=> router.push("/")} className={satisfy.className + " cursor-pointer flex items-center"}>
                Wake <span className="text-red-500 px-3"> N </span> Bake
            </h2>
            <ul className="sm:flex gap-8 hidden lg:gap-12 xl:gap-20 items-center text-gray-500  transition-all duration-200 justify-between">
                <li>
                    <Link href="/" className={"hover:text-gray-200" + (pathname === "/" ?  " text-gray-100 " : "")}>
                        home
                    </Link>
                </li>
                <li>
                    <Link href="/menu" className={"hover:text-gray-200" +( pathname === "/menu" ?  " text-gray-100 " : "")}>
                            menu
                    </Link>
                </li>
                <li>
                    <Link href="/about" className={"hover:text-gray-200" + (pathname === "/about" ?  " text-gray-100 " : "")}>
                        about
                    </Link>
                </li>
            </ul>
            <div className="flex gap-1 sm:gap-4 items-center">
                <div onClick={()=>router.push("/cart")} className="flex gap-1 md:gap-2 cursor-pointer md:hover:bg-black md:p-2 md:px-3 hover:shadow-md hover:shadow-gray-600 justify-center w-full rounded-full">
                    <motion.div
                        className="flex items-center justify-center w-full"
                        animate={{
                            rotate: isVibrating ? [0, -10, 10,-10,10,0] : 0,
                            scale: isVibrating ? 1.3 : 1,
                        }}
                        transition={{
                            rotate : {
                                type: "tween",
                                duration : 1,
                            }
                            ,scale : {
                                type: "spring",
                                stiffness: 300,
                                damping: 10,
                        }}}
                    >
                        <LuShoppingCart className="w-6 h-6 text-center mx-auto" />
                    </motion.div>
                    <p>
                        {!!itemCount ? (itemCount) : "0"}
                    </p>
                </div>
                <div>
                    {
                        !!session ? (
                            <UserDropdown />
                        ) : (
                            <Button onClick={()=>signIn()} className="bg-red-500 hidden sm:block text-white rounded-full hover:bg-red-500 hover:shadow-md hover:shadow-gray-600" >
                                sign-Up
                            </Button>
                        )
                    }
                </div>
                {/* <div>
                    <ModeToggle />
                </div> */}
            <Button  onClick={()=>setIsMobileNavOpen(!isMobileNavOpen)} className="bg-red-500 w-full block sm:hidden text-white rounded-full hover:bg-red-500 hover:shadow-md hover:shadow-gray-600" >
                <GiHamburgerMenu className="w-6 h-6" />
            </Button>
            </div>
        </nav>

        {/* MoBile Nav */}
        <nav className={"w-full px-2 bg-black rounded-lg sticky md:hidden items-center justify-evenly py-2 md:pb-10 transition-all duration-300 " + (isMobileNavOpen ? "flex flex-col" : "hidden")}>
            <Link className="w-full text-center hover:bg-gray-900 rounded-lg py-1" href="/">Home</Link>
            <Link className="w-full text-center hover:bg-gray-900 rounded-lg py-1" href="/menu">Menu</Link>
            <Link className="w-full text-center hover:bg-gray-900 rounded-lg py-1" href="/about">About</Link>
            <div className="w-full">
                {
                    !session && (
                        <Button variant={"ghost"} onClick={()=>signIn()} className="w-full text-red-400 bg-none block sm:hidden rounded-full hover:bg-red-500 hover:shadow-md hover:shadow-gray-600" >
                            Sign-Up
                        </Button>
                    )
                }
            </div>
        </nav>
        </>
    )
}