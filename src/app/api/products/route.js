import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
import prisma from "@/lib/prismadb";
import { isWithinTimeSlot, calculateDistance } from "@/lib/utils";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sellerId = searchParams.get('sellerId');
        const category = searchParams.get('category');
        const sort = searchParams.get('sort') || 'newest';
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const userLat = parseFloat(searchParams.get('lat'));
        const userLng = parseFloat(searchParams.get('lng'));
        const featuredParam = searchParams.get('featured');
        const isFeaturedFilter = featuredParam === 'true' || featuredParam === '1' || featuredParam === 'yes';

        // Enforce mandatory location for any product fetch
        if (Number.isNaN(userLat) || Number.isNaN(userLng)) {
            return NextResponse.json(
                { error: "Latitude and longitude are required for fetching products" },
                { status: 400 }
            );
        }
        
        // Get current UTC time
        const currentTime = new Date();
        
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
                }
            ]
        };
        
        // Add sellerId filter if provided
        if (sellerId) {
            whereClause.sellerId = sellerId;
        }
        if (isFeaturedFilter) {
            whereClause.isFeatured = true;
        }
        
        // Add category filter if provided by user
        if (category) {
            whereClause.categories = {
                has: category,
            };
        }
        
        // Build the query
        const query = {
            where: whereClause,
            take: limit,
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

        // Filter products by time slot on the application level
        // This is necessary because Prisma doesn't support complex time comparisons
        const timeFilteredProducts = products.filter(product => {
            return isWithinTimeSlot(product.startTime, product.endTime, currentTime);
        });

        // Filter products by distance if user location is provided
        let distanceFilteredProducts = timeFilteredProducts;
        const hasLat = !Number.isNaN(userLat);
        const hasLng = !Number.isNaN(userLng);
        // Always apply distance filter when coordinates are provided (mandatory rule)
        if (hasLat && hasLng) {
            distanceFilteredProducts = timeFilteredProducts.filter(product => {
                if (!product.seller.gpsLocation) {
                    return false; // Exclude products from sellers without GPS location
                }
                
                const sellerLocation = product.seller.gpsLocation;
                let sellerLat, sellerLng;
                
                // Handle different formats of location data
                if (typeof sellerLocation === 'object') {
                    if (sellerLocation.hasOwnProperty('latitude') && sellerLocation.hasOwnProperty('longitude')) {
                        sellerLat = sellerLocation.latitude;
                        sellerLng = sellerLocation.longitude;
                    } else if (sellerLocation.hasOwnProperty('lat') && sellerLocation.hasOwnProperty('lng')) {
                        sellerLat = sellerLocation.lat;
                        sellerLng = sellerLocation.lng;
                    } else if (Array.isArray(sellerLocation) && sellerLocation.length >= 2) {
                        [sellerLat, sellerLng] = sellerLocation;
                    }
                }
                
                if (sellerLat === undefined || sellerLng === undefined) {
                    return false; // Exclude products with invalid location data
                }
                
                const distance = calculateDistance(userLat, userLng, sellerLat, sellerLng);
                return distance <= 4; // Only include products within 4km
                // return true;
            });
        }
        
        // Format the response
        const formattedProducts = distanceFilteredProducts.map(product => ({
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
        
        return NextResponse.json(formattedProducts);
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}