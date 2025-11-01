import {NextResponse } from "next/server";
import RestoService from "@/services/restoService";

export async function GET(request) {
  try {

    const url = new URL(request.url);
    const searchQuery = (url.searchParams.get("searchQuery") || '').toLowerCase();
    const page = parseInt(url.searchParams.get("page", 1))
    const limit = parseInt(url.searchParams.get("limit", 9))
    const lat = parseFloat(url.searchParams.get("lat"));
    const lng = parseFloat(url.searchParams.get("lng"));

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    const formattedSellers = await RestoService.getNearbyRestaurants(
      lat,
      lng,
      { page, limit, searchQuery },
    );
    
    const hasNextPage = formattedSellers.length > limit;
    if (hasNextPage) {
      sellers.pop(); // Remove the extra item used to check for next page
    }

    return NextResponse.json({formattedSellers, pagination: { page, limit, hasNextPage }});
  } catch (error) {
    console.error("Error fetching sellers:", error);
    return NextResponse.json(
      { error: "Failed to fetch sellers" },
      { status: 500 }
    );
  }
}