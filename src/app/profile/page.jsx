"use client"
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Image from "next/image";
import api from "@/lib/axios";

export default function Profile() {
    const {data: session} = useSession();
    const [orders, setOrders] = useState([]);
    
    useEffect(() => {
        const fetchOrders = async () => {
            // No need to pass userId, the server can extract it from the session cookie
            const response = await api.get("/orders");
            const data = await response.data;
            console.log(data);
            setOrders(data);
        }
        fetchOrders();
    }, []);
    
    return (
        <div className="flex flex-col gap-4 items-center justify-center w-full h-full pt-8">
            <h3 className="text-xl font-bold">User Profile</h3>
            <Image src={session?.user.image || "/default-user.png"} className="rounded-[100%]" alt="profile" width={100} height={100} />
            <div className="flex flex-col gap-1">
                <p className="font-bold">Name:</p>
                <p> {session?.user?.name}</p>
                <p className="h-2" />
                <p className="font-bold">Email:</p>
                <p className="text"> {session?.user?.email}</p>
            </div>
            {/* <p><span className="font-bold">Phone:</span> {session?.user?.phone}</p>
            <p><span className="font-bold">Address:</span> {session?.user?.address}</p> */}
            <div className="flex flex-col gap-6 w-full h-full bg-gray-600 p-4 rounded-lg my-6">
                <div className="font-bold underline underline-offset-8">
                    Orders
                </div>
                <div className="flex flex-col gap-2">
                    {orders.length > 0 ? (
                        orders.map((order) => (
                            <div key={order.id} className="flex justify-between items-center shadow-lg shadow-white/10 bg-gray-800 py-2 px-4 rounded-lg">
                                <div>
                                    {
                                        order.productList.map((product) => (
                                            <div className="flex justify-between gap-3" key={product.id}>
                                                <p>{product.name}</p>
                                                <div className="flex gap-2">
                                                    <p className="text-green-500">{product.price}</p>
                                                    <p>x {product.quantity}</p>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                                <div>
                                    <p className="text-green-500">Rs.{order.totalPrice}</p>
                                </div>
                            </div>
                    ))
                    ) : (
                        <p>No orders yet</p>
                    )}
                </div>
            </div>
        </div>
    )
}
