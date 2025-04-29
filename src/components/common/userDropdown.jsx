import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ArrowRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import CustomAlert from "./customAlert";

export default function UserDropdown() {
    const {data: session} = useSession();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    
    const handleLogout = () => {
        setShowLogoutDialog(true);
    };

    const handleCancel = () => {
        setShowLogoutDialog(false);
    };
    
    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="flex gap-2 px-1 md:px-3 items-center cursor-pointer">
                        <Avatar>
                            <AvatarImage className="rounded-full md:w-full md:h-full w-8 h-8 my-auto mx-auto" src={session?.user?.image} />
                            <AvatarFallback className="bg-red-500">
                                {session?.user?.name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <p className="text-center text-nowrap hidden sm:block">
                            {session?.user?.name}
                        </p>
                        <ChevronDown className="w-4 h-4 hidden sm:block" />
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black text-white border-gray-700 font-semibold">
                    <DropdownMenuItem className="flex items-center justify-between">
                        <Link href="/profile">
                            Profile
                        </Link>
                        <ArrowRight className="w-4 h-4" />
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Button className="w-full text-red-500" onClick={handleLogout}>
                            Log Out
                        </Button>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            
            {showLogoutDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancel} />
                    <div className="relative bg-white dark:bg-black border border-gray-300 dark:border-gray-700 p-6 rounded-lg max-w-md w-full mx-4">
                        <h2 className="text-lg font-semibold mb-2">Are you sure you want to log out?</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            You will need to sign in again to access your account.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button onClick={() => signOut()}>
                                Log Out
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}