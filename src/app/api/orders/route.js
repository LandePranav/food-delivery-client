import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '../auth/auth.config';

import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

export async function GET(request) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');
    const search = searchParams.get('search') || '';
    
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    try {
        const whereClause = {
            userId: session.user.id
        };

        // If sellerId is specified, filter by that seller
        if (sellerId) {
            whereClause.sellerId = sellerId;
        }

        // If search term is provided, search in deliveryAddress
        if (search) {
            whereClause.deliveryAddress = {
                contains: search,
                mode: 'insensitive'
            };
        }

        const orders = await prisma.order.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                seller: {
                    select: {
                        restaurantName: true,
                        username: true,
                    }
                }
            }
        });

        if (!orders || orders.length === 0) {
            return NextResponse.json([], { status: 200 });
        }

        console.log("Orders", orders);
        
        // Process orders to ensure productList is properly formatted and empty address is handled
        const processedOrders = orders.map(order => {
            // Ensure product list is properly processed
            let productList = order.productList;
            if (typeof productList === 'string') {
                try {
                    productList = JSON.parse(productList);
                } catch (e) {
                    console.error("Error parsing product list:", e);
                    productList = [];
                }
            }
            
            // Make sure delivery address is not empty
            const deliveryAddress = order.deliveryAddress && order.deliveryAddress.trim() !== ''
                ? order.deliveryAddress
                : 'No address provided';
                
            return {
                ...order,
                productList,
                deliveryAddress
            };
        });

        return NextResponse.json(processedOrders, { status: 200 });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}