
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import razorpay from "@/lib/razorpay/instance";
import { PRICING_PLANS } from "@/lib/razorpay/pricing";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, currency } = await req.json(); // currency: 'INR' or 'USD'

    // 1. Identify Plan
    const plan = Object.values(PRICING_PLANS).find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid Plan ID" }, { status: 400 });
    }

    // 2. Determine Amount
    const amount = currency === "USD" ? plan.price.USD : plan.price.INR;
    // Razorpay accepts amount in smallest currency unit (paise or cents)
    const amountInSmallestUnit = Math.round(amount * 100);

    // 3. Create Order on Razorpay
    const options = {
      amount: amountInSmallestUnit,
      currency: currency || "INR",
      receipt: `receipt_${Date.now()}_${session.user.email.substring(0, 5)}`,
      notes: {
        userEmail: session.user.email,
        planId: plan.id,
        credits: plan.credits
      }
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
        success: true,
        orderId: order.id,
        amount: amountInSmallestUnit,
        currency: currency || "INR",
        keyId: process.env.RAZORPAY_KEY_ID
    });

  } catch (e: unknown) {
    console.error("Payment Order Error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
  }
}
