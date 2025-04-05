import Razorpay from "razorpay";

import { NextResponse } from "next/server";

import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

export async function POST(request) {
    
    const data = await request.json();
    console.log(data);
    try {
        // Validate address
        if (!data.address || data.address.trim() === '') {
            return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
        }
        
        const order = await razorpay.orders.create({
            amount: data.totalAmount,
            currency: "INR",
            receipt: "receipt_" + Math.random().toString(36).substring(7),
            notes: {
                email: data.email,
                phone: data.phone,
                address: data.address,
            },
        });
        if(order.status === "created"){
            // Prepare product items for storage
            const productItems = data.items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity || 1,
                ...(item.imageUrl && { imageUrl: item.imageUrl }),
                ...(item.image && { image: item.image }),
                ...(item.imageUrls && { imageUrls: item.imageUrls }),
            }));
            
            const dbOrder = await prisma.order.create({
                data: {
                    userId: data.userId || "default-user-id",
                    sellerId: data.items[0].sellerId,
                    productList: productItems,
                    totalPrice: data.totalAmount,
                    deliveryAddress: data.address.trim(),
                    paymentStatus: "pending",
                    deliveryStatus: "processing",
                    paymentId: order.id,
                    gpsLocation: data.gpsLocation,
                },
            });
            console.log("Order Created and stored in database Successfully : ", dbOrder);
        }
        console.log("Order Created Successfully", order);
        return NextResponse.json({ orderId: order.id }, { status: 200 });
    } catch (error) {
        console.log("Error in creating order", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


