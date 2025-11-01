import Razorpay from "razorpay";
import { addHours } from 'date-fns';

import { NextResponse } from "next/server";

import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

export async function POST(request) {
    // Get current time in IST
    const currentISTTime = addHours(new Date(), 5.5);
    const currentHour = currentISTTime.getUTCHours();

    // Check if current time is between 12 AM and 6 AM IST
    // if (currentHour >= 0 && currentHour < 6) {
    //     return NextResponse.json({success: false, message: "Orders cannot be placed between 12 AM and 6 AM IST.", status: 403 });
    // }

    const data = await request.json();
    console.log(data);
    try {
        // Validate address
        if (!data.address || data.address.trim() === '') {
            return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
        }
        
        // Create Razorpay order (not payment)
        const razorpayOrder = await razorpay.orders.create({
            amount: data.totalAmount * 100, // Amount in paise
            currency: "INR",
            receipt: "receipt_" + Math.random().toString(36).substring(7),
            notes: {
                email: data.email,
                phone: data.phone,
                address: data.address,
                sellerId: data.sellerId,
                items: data.items,
            },
        });
        
        if(razorpayOrder.status === "created"){
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

            // update user phone number
            await prisma.user.update({
                where: { id: data.userId },
                data: { phone: data.phone },
            });
            
            // Store order in database with pending status
            const dbOrder = await prisma.order.create({
                data: {
                    userId: data.userId || "default-user-id",
                    sellerId: data.items[0].sellerId,
                    productList: productItems,
                    totalPrice: data.totalAmount,
                    deliveryAddress: data.address.trim(),
                    paymentStatus: "pending",
                    deliveryStatus: "PROCESSING",
                    orderId: razorpayOrder.id, // Store Razorpay order ID
                    paymentId: null, // This will be updated when payment succeeds
                    gpsLocation: data.gpsLocation,
                },
            });
            console.log("Order Created and stored in database Successfully : ", dbOrder);
        }
        
        console.log("Razorpay Order Created Successfully", razorpayOrder);
        return NextResponse.json({ 
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
        }, { status: 200 });
    } catch (error) {
        console.log("Error in creating order", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}