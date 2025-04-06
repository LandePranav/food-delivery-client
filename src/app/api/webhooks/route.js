import { NextResponse } from "next/server";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";
import api from "@/lib/axios";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

export async function POST(request) {
    try {
        const rawBody = await request.text();
        const webhookSignature = request.headers.get("X-Razorpay-Signature");
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        
        // Validate webhook signature
        const isValid = validateWebhookSignature(
            rawBody,
            webhookSignature,
            webhookSecret
        );
        
        if (!isValid) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }
        
        const payload = JSON.parse(rawBody);
        const { event, payload: eventPayload } = payload;
        
        // console.log("Webhook received:", event);
        // console.log("Payload: ", eventPayload);
        
        // Handle different event types
        if (event === "payment.authorized") {
            // Payment is authorized but not yet captured
            await prisma.order.updateMany({
                where: { orderId: eventPayload.order?.entity.id },
                data: {
                    paymentStatus: "authorized",
                    paymentId: eventPayload.payment?.entity.id
                }
            });
        } 
        else if (event === "payment.captured") {
            // Payment is captured (completed)
            await prisma.order.updateMany({
                where: { orderId: eventPayload.order?.entity.id },
                data: {
                    paymentStatus: "completed",
                    paymentId: eventPayload.payment?.entity.id
                }
            });
        }
        else if (event === "payment.failed") {
            // Payment failed
            await prisma.order.updateMany({
                where: { orderId: eventPayload.order?.entity.id },
                data: {
                    paymentStatus: "failed"
                }
            });
        }
        
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error processing webhook:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
