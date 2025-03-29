import { NextResponse} from "next/server";
// import { validateWebhook } from "@razorpay/razorpay-node";

export async function POST(request) {
    const { event, data } = await request.json();
    console.log("request : ",request);
    console.log("event : ",event);
    console.log("data : ",data);
    // const isValid = await validateWebhook(data, "admin");
    // if (!isValid) {
    //     return NextResponse.json({ message: "Invalid webhook" }, { status: 400 });
    // }
    return NextResponse.json({ message: "Webhook received" }, { status: 200 });
}
