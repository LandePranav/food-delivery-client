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
        
        // Get current time in India (IST = UTC+5:30)
        const now = new Date();
        const indiaTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
        const hours = indiaTime.getUTCHours();
        const minutes = indiaTime.getUTCMinutes();
        const currentTimeInMinutes = hours * 60 + minutes;
        
        // Check if current time is within operating hours (6am to 12am)
        // const isOperatingHours = currentTimeInMinutes >= 6 * 60 && currentTimeInMinutes <= 24 * 60;
        const isOperatingHours = true;
        
        // Return empty array if outside operating hours
        if (!isOperatingHours) {
            return NextResponse.json([]);
        }
        
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
        
        // Add category filter if provided by user
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

        // Add priority sorting to the query
        query.orderBy = [
            { priority: 'desc' },
            ...(Array.isArray(query.orderBy) ? query.orderBy : query.orderBy ? [query.orderBy] : [])
        ];
        
        const products = await prisma.product.findMany(query);

        // Filter products based on time of day and their categories
        const isBreakfastTime = currentTimeInMinutes >= 6 * 60 && currentTimeInMinutes <= 12 * 60;
        const isLunchTime = currentTimeInMinutes >= 9 * 60 && currentTimeInMinutes <= 15 * 60;
        const isDinnerTime = currentTimeInMinutes >= 18 * 60 && currentTimeInMinutes <= 24 * 60;
        
        const filteredProducts = products.filter(product => {
            // If product has no categories, include it during operating hours
            if (!product.categories || product.categories.length === 0) {
                return true;
            }
            
            const categories = product.categories.map(cat => cat.toLowerCase());
            
            // Check if product has breakfast category and if it's breakfast time
            const hasBreakfast = categories.includes('breakfast');
            if (hasBreakfast && !isBreakfastTime) {
                return false;
            }
            
            // Check if product has lunch category and if it's lunch time
            const hasLunch = categories.includes('lunch');
            if (hasLunch && !isLunchTime) {
                return false;
            }
            
            // Check if product has dinner category and if it's dinner time
            const hasDinner = categories.includes('dinner');
            if (hasDinner && !isDinnerTime) {
                return false;
            }
            
            return true;
        });
        
        // Format the response
        const formattedProducts = filteredProducts.map(product => ({
            id: product.id,
            name: product.name,
            price: Number(product.price) + Number(product.addedCost),
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