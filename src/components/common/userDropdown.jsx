import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ArrowRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";


export default function UserDropdown() {
    const {data: session} = useSession();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <div className="w-full flex gap-2 justify-center items-center">
                    <Avatar>
                        <AvatarImage className="rounded-full md:w-10 md:h-10 w-8 h-8 mx-auto" src={session.user.image} />
                        <AvatarFallback>
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
                    <Link href="#">
                        Profile
                    </Link>
                    <ArrowRight className="w-4 h-4" />
                </DropdownMenuItem>
                {/* <DropdownMenuSeparator /> */}
                <DropdownMenuItem>
                    <Button className="w-full text-red-500" onClick={()=>signOut()}>
                        Log Out
                    </Button>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}