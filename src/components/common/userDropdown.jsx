import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ArrowRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function UserDropdown() {
    const {data: session} = useSession();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    
    const handleLogout = () => {
        setShowLogoutDialog(true);
    };
    
    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <div className="w-full h-full flex gap-2 justify-center items-center">
                        <Avatar>
                            <AvatarImage className="rounded-full md:w-10 md:h-10 w-8 h-8 my-auto mx-auto" src={session?.user?.image} />
                            <AvatarFallback className="bg-red-500">
                                {session.user.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <p className="text-center text-nowrap hidden sm:block">
                            {session.user.name}
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
                    {/* <DropdownMenuSeparator /> */}
                    <DropdownMenuItem>
                        <Button className="w-full text-red-500" onClick={handleLogout}>
                            Log Out
                        </Button>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            
            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <AlertDialogContent className="max-w-[80vw] rounded-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You will need to sign in again to access your account.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="text-red-500" onClick={() => signOut()}>Log Out</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}