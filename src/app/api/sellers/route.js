import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";

export async function GET() {
  try {
    // Fetch all sellers with their restaurant information
    const sellers = await prisma.seller.findMany({
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
        // Explicitly excluding bankDetails
      },
      where: {
        active: true,
      },
      orderBy: {
        restaurantName: 'asc',
      },
    });

    // Format the response
    const formattedSellers = sellers.map(seller => ({
      id: seller.id,
      name: seller.username,
      restaurantName: seller.restaurantName || seller.username,
      specialty: seller.speciality || 'Various cuisines',
      address: seller.address || 'Address not available',
      phone: seller.phone,
      profile: seller.profile,
      gpsLocation: seller.gpsLocation,
      productCount: seller._count.products,
    }));

    return NextResponse.json(formattedSellers);
  } catch (error) {
    console.error("Error fetching sellers:", error);
    return NextResponse.json(
      { error: "Failed to fetch sellers" },
      { status: 500 }
    );
  }
} 