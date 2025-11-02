import { NextResponse } from "next/server";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sendAdminOrderEmail } from "@/lib/mailer";

const prisma = new PrismaClient().$extends(withAccelerate());

export async function POST(request) {
    try {
        console.log("Webhook received");
        const rawBody = await request.text();
        const webhookSignature = request.headers.get("X-Razorpay-Signature");
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const adminEmail = process.env.ADMIN_EMAIL;
        
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
        console.log("Payload: ", eventPayload);
        
        // Handle different event types
        if (event === "payment.authorized") {
            // Payment is authorized but not yet captured
            console.log("Payment Status: Authorized");
            await prisma.order.update({
                where: { orderId: eventPayload.payment?.entity?.order_id },
                data: {
                    paymentStatus: "authorized",
                    paymentId: eventPayload.payment?.entity.id
                }
            });
            // Intentionally do not send email on authorization. Email will be sent on capture.
        } 
        else if (event === "payment.captured") {
            console.log("Payment captured");
            // Payment is captured (completed)
            const updatedOrder = await prisma.order.update({
                where: { orderId: eventPayload.payment?.entity?.order_id },
                data: {
                    paymentStatus: "completed",
                    paymentId: eventPayload.payment?.entity.id
                },
                include: {
                    user: {
                        select: { name: true, email: true, phone: true }
                    },
                    seller: {
                        select: {id: true, restaurantName: true, username: true, role: true }
                    }
                }
            });

            const admins = await prisma.seller.findMany({
                where: {
                    role: "admin"
                }
            })


            //sending web push notification to admins
            if (admins.length > 0) {
                const adminNotifications = admins.map((admin)=> {
                    return fetch(`${process.env.SELLER_API_URL}/web-push/send`, {
                        method: "POST",
                        body: JSON.stringify({ sellerId: updatedOrder.seller.id, message:`Order: \n${updatedOrder.productList.map((item) => `${item.name} x${item.quantity}\n` ).join(" ")}`  })
                    }) 
                })
                await Promise.all(adminNotifications);
            }

            //send web push to seller himself if he is not admin
            if (updatedOrder.seller.role !== "admin") {
                await fetch(`${process.env.SELLER_API_URL}/web-push/send`, {
                    method: "POST",
                    body: JSON.stringify({ sellerId: updatedOrder.seller.id, message:`Order: \n${updatedOrder.productList.map((item) => `${item.name} x${item.quantity}\n` ).join(" ")}`  })
                })
            }

            //sending email to admin
            if (adminEmail) {
                try {
                    console.log("Sending admin email for captured payment");
                    await sendAdminOrderEmail({ order: updatedOrder, to: adminEmail });
                    console.log("Admin email sent successfully");
                } catch (mailErr) {
                    console.error("Failed to send admin email for captured payment:", mailErr);
                }
            }
        }
        else if (event === "payment.failed") {
            // Payment failed
            await prisma.order.update({
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
