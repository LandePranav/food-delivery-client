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
            const dbOrder = await prisma.order.create({
                data: {
                    userId: data.userId || "default-user-id", // You'll need to get the actual user ID
                    sellerId: data.items[0].sellerId, // Assuming all items are from the same seller
                    productList: data.items,
                    totalPrice: data.totalAmount,
                    deliveryAddress: data.address,
                    paymentStatus: "pending",
                    deliveryStatus: "processing",
                    paymentId: order.id,
                },
            });
            console.log("Order Created and stored in database Successfully : ", dbOrder);
        }
        console.log("Order Created Successfully", order);
        return NextResponse.json({ orderId: order.id }, { status: 200 });
    } catch (error) {
        console.log("Error in creating order", error);
        return NextResponse.json({ error: error }, { status: 500 });
    }
}


