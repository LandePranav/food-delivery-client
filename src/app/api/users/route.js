import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth.config";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

// GET request handler to fetch user addresses
export async function GET() {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Fetch user with addresses
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user addresses:", error);
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 });
  }
}

// POST request handler to add a new address
export async function PATCH(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate input
    if (!body || !body.address || typeof body.address !== 'string' || !body.address.trim()) {
      return NextResponse.json({ error: "Valid address is required" }, { status: 400 });
    }
    
    const address = body.address.trim();

    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id }
    });
    // console.log(currentUser);

    if (!currentUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Get current user data
    const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
            addresses: {
                push: address
            }
        }
    })

    if (!updatedUser) {
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Address added successfully"
    });
    
  } catch (error) {
    console.error("Error adding address:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to add address" 
    }, { status: 500 });
  }
}
