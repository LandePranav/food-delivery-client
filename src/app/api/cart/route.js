import { NextResponse } from "next/server";

import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

export async function GET() {
    
    const seller = await prisma.seller.findFirst();
    const deliveryCharge = seller.deliveryCharge;

    return NextResponse.json({ deliveryCharge });
}
