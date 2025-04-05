import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient().$extends(withAccelerate());

export async function GET(request) {
    try {
        // Get auth token from request cookies
        const token = request.cookies.get('token')?.value;
        
        if (!token) {
            return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 });
        }
        
        // Verify token
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
        }
        
        const sellerId = decodedToken.id;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search') || '';
        
        // Build the query
        const whereClause = {
            sellerId
        };
        
        // Add delivery status filter if provided
        if (status && status !== 'all') {
            whereClause.deliveryStatus = status;
        }
        
        // Add search filter
        if (search) {
            whereClause.deliveryAddress = {
                contains: search,
                mode: 'insensitive'
            };
        }
        
        // Fetch orders
        const orders = await prisma.order.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });
        
        if (!orders || orders.length === 0) {
            return NextResponse.json([], { status: 200 });
        }
        
        // Process orders to ensure productList is properly formatted
        const processedOrders = orders.map(order => {
            return {
                ...order,
                // Ensure productList is properly accessible
                productList: Array.isArray(order.productList) 
                    ? order.productList 
                    : (typeof order.productList === 'string' 
                        ? JSON.parse(order.productList) 
                        : order.productList)
            };
        });
        
        return NextResponse.json(processedOrders, { status: 200 });
    } catch (error) {
        console.error("Error fetching seller orders:", error);
        return NextResponse.json(
            { error: "Error fetching orders", details: error.message }, 
            { status: 500 }
        );
    }
}

// Update order status
export async function PATCH(request) {
    try {
        // Get auth token from request cookies
        const token = request.cookies.get('token')?.value;
        
        if (!token) {
            return NextResponse.json({ error: "Unauthorized - No token provided" }, { status: 401 });
        }
        
        // Verify token
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
        }
        
        const sellerId = decodedToken.id;
        const data = await request.json();
        const { orderId, status } = data;
        
        if (!orderId || !status) {
            return NextResponse.json({ error: "Order ID and status are required" }, { status: 400 });
        }
        
        // First, verify that this order belongs to the seller
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });
        
        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        
        if (order.sellerId !== sellerId) {
            return NextResponse.json({ error: "Unauthorized - This order does not belong to you" }, { status: 403 });
        }
        
        // Update the order status
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { deliveryStatus: status }
        });
        
        return NextResponse.json({
            success: true,
            message: `Order status updated to ${status}`,
            order: updatedOrder
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        return NextResponse.json(
            { error: "Error updating order status", details: error.message }, 
            { status: 500 }
        );
    }
} 