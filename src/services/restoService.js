import prisma from "@/lib/prismadb";
import { MAX_DISTANCE_KM } from "@/config/config";
import { calculateDistance } from "@/lib/utils";

const RestoService = {
    // Your final implementation
    getNearbyRestaurants: async (userLat, userLon, filters={}, onlyIds = false) => {
        //Future optimisation when updating schema
        // const latDelta = MAX_DISTANCE_KM / 111;
        // const lonDelta = MAX_DISTANCE_KM / (111 * Math.cos(userLat * Math.PI / 180));
        const { page = 1, limit = 9, searchQuery = '' } = filters;
        const whereClause = {
            active: true,
            //Future optimisation when updating schema
            // latitude: { gte: userLat - latDelta, lte: userLat + latDelta },
            // longitude: { gte: userLon - lonDelta, lte: userLon + lonDelta },
        };

        if( searchQuery && searchQuery.length > 0 ) {
            whereClause.restaurantName = {
                contains: searchQuery,
                mode: "insensitive",
            };
        }
  
        const restaurants = await prisma.seller.findMany({
            ...(onlyIds ? {select: {id: true, gpsLocation:true}}: {
                select: {
                id: true,
                username: true,
                restaurantName: true,
                speciality: true,
                address: true,
                phone: true,
                profile: true,
                active: true,
                gpsLocation: true,
                // Include count of products for each seller
                _count: {
                select: {
                    products: true,
                },
                },
            },
            } ),
            where: whereClause,
            orderBy: {
                restaurantName: 'asc',
            },
            skip: (page - 1) * limit,
            take: limit + 1,
        });
  
        const filteredRestos =  restaurants
            .map(resto => ({
            ...resto,
            distance: calculateDistance(userLat, userLon, resto?.gpsLocation?.latitude, resto?.gpsLocation?.longitude)
            }))
            .filter(resto => resto.distance <= MAX_DISTANCE_KM)
            .sort((a, b) => a.distance - b.distance);

            
        return onlyIds ? filteredRestos.map(r => r.id) : filteredRestos.map((seller)=> ({
            id: seller.id,
            name: seller.username,
            restaurantName: seller.restaurantName || seller.username,
            specialty: seller.speciality || 'Various cuisines',
            address: seller.address || 'Address not available',
            phone: seller.phone,
            profile: seller.profile,
            gpsLocation: seller.gpsLocation,
            productCount: seller._count.products,
            distance: seller.distance
        }));
}
}

export default RestoService;