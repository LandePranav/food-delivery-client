import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import crypto from "crypto";

const prisma = new PrismaClient().$extends(withAccelerate());

export async function POST(request) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = await request.json();
    
    try {
        // Verify signature
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpayOrderId + "|" + razorpayPaymentId)
            .digest("hex");
            
        if (generatedSignature !== razorpaySignature) {
            return NextResponse.json({ 
                success: false, 
                message: "Payment verification failed" 
            }, { status: 400 });
        }
        
        // Update order in database
        const updatedOrder = await prisma.order.updateMany({
            where: { orderId: razorpayOrderId },
            data: {
                paymentStatus: "completed",
                paymentId: razorpayPaymentId
            }
        });

        if(!updatedOrder){
            return NextResponse.json({status:500}, {message: "Error in Updating payment status."})
        }
        
        return NextResponse.json({ 
            success: true, 
            message: "Payment verified successfully" 
        }, { status: 200 });
    } catch (error) {
        console.error("Error verifying payment:", error);
        return NextResponse.json({ 
            success: false, 
            message: "Payment verification failed", 
            error: error.message 
        }, { status: 500 });
    }
} 