"use client"
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Image from "next/image";
import api from "@/lib/axios";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Package, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Profile() {
    const {data: session} = useSession();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    
    useEffect(() => {
        const fetchOrders = async () => {
            setIsLoading(true);
            try {
                const response = await api.get("/orders");
                const data = response.data;
                setOrders(data);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setIsLoading(false);
            }
        }
        
        if (session?.user) {
            fetchOrders();
        }
    }, [session]);
    
    if (!session) {
        return (
            <PageLayout>
                <div className="flex flex-col items-center justify-center py-12">
                    <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Please sign in to view your profile</h2>
                    <Button onClick={()=> router.push("/api/auth/signin")} className="text-red-500 my-8 border-2 border-yellow-400">
                        SIGN - IN
                    </Button>
                </div>
            </PageLayout>
        )
    }
    
    return (
        <PageLayout>
            <div className="flex flex-col gap-6">
                {/* Profile Info */}
                <Card className="bg-white dark:bg-[#1E1E1E] border-gray-100 dark:border-[#333333]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-gray-200 dark:border-[#333333]">
                                <Image 
                                    src={session?.user?.image || "/default-user.png"} 
                                    alt="Profile picture"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{session?.user?.name || "Not provided"}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{session?.user?.email || "Not provided"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Orders */}
                <Card className="bg-white dark:bg-[#1E1E1E] border-gray-100 dark:border-[#333333]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">My Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400">Loading your orders...</p>
                            </div>
                        ) : orders.length > 0 ? (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <div key={order.id} className="bg-gray-50 dark:bg-[#252525] rounded-lg p-4 border border-gray-100 dark:border-[#333333]">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Order ID: <span className="font-medium text-gray-700 dark:text-gray-300">{order.id.slice(0, 8)}</span>
                                            </p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                ₹{order.totalPrice}
                                            </p>
                                        </div>
                                        
                                        <div className="border-t border-gray-100 dark:border-[#333333] pt-3 space-y-2">
                                            {order.productList.map((product) => (
                                                <div key={product.id} className="flex justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-gray-700 dark:text-gray-300">{product.name}</p>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">x{product.quantity}</span>
                                                    </div>
                                                    <p className="text-gray-700 dark:text-gray-300">₹{product.price * product.quantity}</p>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="mt-3 text-xs flex justify-between items-center pt-2 border-t border-gray-100 dark:border-[#333333]">
                                            <p className="text-gray-500 dark:text-gray-400">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </p>
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                order.deliveryStatus === "delivered" 
                                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
                                                    : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                                            }`}>
                                                {order.deliveryStatus || "Processing"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400">You haven't placed any orders yet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    )
}
