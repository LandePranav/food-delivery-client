import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {withAccelerate} from "@prisma/extension-accelerate";
const prisma = new PrismaClient().$extends(withAccelerate());

export async function GET(request, { params }) {

    const id = await params?.id;

    try {
        const product = await prisma.product.findUnique({
            where: { id: id },
            include: {
                seller: {
                    select: {
                        restaurantName: true,
                        username: true,
                    },
                },
            },
        });
        
        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }
        
        // Format the response
        const formattedProduct = {
            id: product.id,
            name: product.name,
            price: Number(product.price) + Number(product.addedCost || 0),
            description: product.description,
            imageUrls: product.imageUrls,
            categories: product.categories,
            sellerId: product.sellerId,
            restaurantName: product.seller.restaurantName || product.seller.username
        };
        
        return NextResponse.json(formattedProduct);
    } catch (error) {
        console.error("Error fetching product:", error);
        return NextResponse.json(
            { error: "Failed to fetch product" },
            { status: 500 }
        );
    }
}
