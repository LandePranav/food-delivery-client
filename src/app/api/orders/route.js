import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

export async function GET() {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    // Now you can safely use session.user.id to fetch orders
    // The user can't tamper with this ID as it comes from the secure session
    try {
        const orders = await prisma.order.findMany({
            where: {
                userId: session.user.id
            }
        });

    if (!orders) {
        return new Response(JSON.stringify({ message: "No orders found" }), {
            status: 200,
        });
    }

        return NextResponse.json(orders, { status: 200 });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
        });
    }
}