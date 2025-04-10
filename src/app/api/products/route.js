import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
import prisma from "@/lib/prismadb";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sellerId = searchParams.get('sellerId');
        const category = searchParams.get('category');
        const sort = searchParams.get('sort') || 'newest';
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        
        // Build the query
        const query = {
            where: {
                visible: true,
                seller: {
                    active: true
                }
            },
            take: limit,
            include: {
                seller: {
                    select: {
                        restaurantName: true,
                        username: true,
                        deliveryCharge: true
                        // bankDetails explicitly excluded
                    },
                },
            },
        };
        
        // Add sellerId filter if provided
        if (sellerId) {
            query.where = {
                ...query.where,
                sellerId: sellerId
            };
        }
        
        // Add category filter if provided
        if (category) {
            query.where.categories = {
                has: category,
            };
        }
        
        // Add sorting
        if (sort === 'popularity') {
            // This is a placeholder for sorting by popularity
            // In a real app, you might have a views or orders count to sort by
            query.orderBy = { createdAt: 'desc' };
            query.take = 7;
        } else if (sort === 'price-asc') {
            query.orderBy = { price: 'asc' };
        } else if (sort === 'price-desc') {
            query.orderBy = { price: 'desc' };
        } else {
            // Default sort by newest
            query.orderBy = { createdAt: 'desc' };
        }

        const products = await prisma.product.findMany(query);

        // console.log("products: ", products);
        
        // Format the response
        const formattedProducts = products.map(product => ({
            id: product.id,
            name: product.name,
            price: Number(product.price) + Number(product.seller.deliveryCharge),
            description: product.description,
            imageUrls: product.imageUrls,
            categories: product.categories,
            sellerId: product.sellerId,
            restaurantName: product.seller.restaurantName || product.seller.username,
            isFeatured: product.isFeatured
        }));
        
        return NextResponse.json(formattedProducts);
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}