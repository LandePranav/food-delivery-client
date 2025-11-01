import { NextResponse } from "next/server";
import prisma from "@/lib/prismadb";
import { calculateDistance } from "@/lib/utils";
import { MAX_DISTANCE_KM} from "@/config/config"

export async function GET(request, { params }) {
  try {

    const { id } = await params;
    const {searchParams} = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat"));
    const lng = parseFloat(searchParams.get("lng"));

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

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

    const userDistance = calculateDistance(lat, lng, seller.gpsLocation.latitude, seller.gpsLocation.longitude);

    if (userDistance > MAX_DISTANCE_KM) {
      return NextResponse.json(
        { error: "Seller is out of delivery range" },
        { status: 400 }
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
      distance: userDistance
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