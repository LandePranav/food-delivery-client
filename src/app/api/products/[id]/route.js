import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {withAccelerate} from "@prisma/extension-accelerate";
import { calculateDistance } from "@/lib/utils";
import { MAX_DISTANCE_KM } from "@/config/config";

const prisma = new PrismaClient().$extends(withAccelerate());

export async function GET(request, { params }) {

    const {id} = await params;
    const {searchParams} = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat"));
    const lng = parseFloat(searchParams.get("lng"));

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return NextResponse.json(
            { error: "Location is required" },
            { status: 400 }
        );
    }
    

    try {
        const product = await prisma.product.findUnique({
            where: { id: id },
            include: {
                seller: {
                    select: {
                        restaurantName: true,
                        username: true,
                        gpsLocation: true
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

    const userDistance = calculateDistance(lat, lng, product.seller.gpsLocation.latitude, product.seller.gpsLocation.longitude);
    if (userDistance > MAX_DISTANCE_KM) {
        return NextResponse.json(
            { error: "Product is out of delivery range" },
            { status: 400 }
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
