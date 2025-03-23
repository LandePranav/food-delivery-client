import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const prisma = new PrismaClient().$extends(withAccelerate());

export async function GET() {
    try {
        const response = await prisma.product.findMany();
        if (!response) {
            return NextResponse.json({ error: "No products found" }, { status: 404 });
        }
        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}