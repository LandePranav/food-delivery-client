import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";

export async function GET(request, { params }) {

  try {

    const { id } = await params;

    // Fetch the seller with the given ID
    const seller = await prisma.seller.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        username: true,
        restaurantName: true,
        speciality: true,
        address: true,
        phone: true,
        profile: true,
        gpsLocation: true,
        active: true,
        // Explicitly excluding bankDetails
      },
    });

    if (!seller) {
      return NextResponse.json(
        { error: "Seller not found" },
        { status: 404 }
      );
    }

    // Format the response
    const formattedSeller = {
      id: seller.id,
      name: seller.username,
      restaurantName: seller.restaurantName || seller.username,
      specialty: seller.speciality || 'Various cuisines',
      address: seller.address || 'Address not available',
      phone: seller.phone,
      profile: seller.profile,
      gpsLocation: seller.gpsLocation,
    };

    return NextResponse.json(formattedSeller);
  } catch (error) {
    console.error("Error fetching seller:", error);
    return NextResponse.json(
      { error: "Failed to fetch seller" },
      { status: 500 }
    );
  }
} 