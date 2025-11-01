import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
import prisma from "@/lib/prismadb";
import { isWithinTimeSlot } from "@/lib/utils";
import RestoService from "@/services/restoService";


export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sellerId = searchParams.get('sellerId');
        const category = (searchParams.get('category') || 'all').toLowerCase();
        const sort = searchParams.get('sort') || 'newest';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const userLat = parseFloat(searchParams.get('lat'));
        const userLng = parseFloat(searchParams.get('lng'));
        const featuredParam = searchParams.get('featured');
        const isFeaturedFilter = featuredParam === 'true' || featuredParam === '1' || featuredParam === 'yes';
        const searchQuery = (searchParams.get('searchQuery') || '').toLowerCase();

        // Enforce mandatory location for any product fetch
        if (Number.isNaN(userLat) || Number.isNaN(userLng)) {
            return NextResponse.json(
                { error: "Latitude and longitude are required for fetching products" },
                { status: 400 }
            );
        }
        
        // Get current UTC time
        const currentTime = new Date();

        const nearBySellerIds = await RestoService.getNearbyRestaurants(
            userLat,
            userLng,
            { page: 1, limit: 100 }, // Fetch a large number to cover all nearby sellers
            true // onlyIds
        );

        
        // Build the where clause for time slot filtering
        let whereClause = {
            visible: true,
            seller: {
                active: true
            },
            AND: [
                {
                    OR: [
                        // Products with no time slot (always available)
                        {
                            startTime: null,
                            endTime: null
                        },
                        // Products with time slots (will be filtered later)
                        {
                            startTime: { not: null },
                            endTime: { not: null }
                        }
                    ]
                },
                { sellerId: { in: nearBySellerIds }}
            ]
        };

        // Add search query filter if provided
        if (searchQuery && searchQuery.length > 0) {
            whereClause.AND.push({
                OR: [
                    { name: {
                        contains: searchQuery,
                        mode: 'insensitive'
                    }},
                    { description: {
                        contains: searchQuery,
                        mode: 'insensitive'
                    }}
                ]
            });
        }
        
        // Add sellerId filter if provided
        if (sellerId && sellerId.length > 0) {
            whereClause.sellerId = sellerId;
        }

        if (isFeaturedFilter) {
            whereClause.isFeatured = true;
        }
        
        // Add category filter if provided by user
        if (category && category !== 'all') {
            whereClause.categories = {
                has: category,
            };
        }
        
        // Build the query
        const query = {
            where: whereClause,
            take: limit + 1,
            skip: (page - 1) * limit,
            include: {
                seller: {
                    select: {
                        restaurantName: true,
                        username: true,
                        deliveryCharge: true,
                        gpsLocation: true
                        // bankDetails explicitly excluded
                    },
                },
            },
        };
        
        // Add sorting
        if (sort === 'popularity') {
            // This is a placeholder for sorting by popularity
            // In a real app, you might have a views or orders count to sort by
            query.orderBy = { createdAt: 'desc' };
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

        // Filter products by time slot on the application level
        // This is necessary because Prisma doesn't support complex time comparisons
        const timeFilteredProducts = products.filter(product => {
            return isWithinTimeSlot(product.startTime, product.endTime, currentTime);
        });
        
        const formattedProducts = timeFilteredProducts.map(product => ({
            id: product.id,
            name: product.name,
            price: Number(product.price) + Number(product.addedCost),
            description: product.description,
            imageUrls: product.imageUrls,
            categories: product.categories,
            sellerId: product.sellerId,
            restaurantName: product.seller.restaurantName || product.seller.username,
            isFeatured: product.isFeatured,
            startTime: product.startTime,
            endTime: product.endTime
        }));

        const pagination = {
            page,
            limit,
            hasNextPage: formattedProducts.length > limit
        }
        if (pagination.hasNextPage) {
            formattedProducts.pop(); // Remove the extra item used to check for next page
        }
        
        return NextResponse.json({formattedProducts, pagination});
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}