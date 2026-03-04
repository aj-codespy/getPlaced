
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

    // 3. Find or Create a Plan on Razorpay
    const { items: existingPlans } = await razorpay.plans.all();
    let rzpPlan = (existingPlans as any[]).find((p) => p.item.name === plan.name && p.item.amount === amountInSmallestUnit && p.item.currency === (currency || "INR") && p.period === "monthly");
    
    if (!rzpPlan) {
        rzpPlan = await razorpay.plans.create({
            period: "monthly",
            interval: 1,
            item: {
                name: plan.name,
                amount: amountInSmallestUnit,
                currency: currency || "INR",
                description: `${plan.name} Monthly Subscription`
            }
        });
    }

    // 4. Create Subscription on Razorpay
    const options = {
      plan_id: rzpPlan.id,
      customer_notify: 1,
      total_count: 120, // 10 years duration max
      notes: {
        userEmail: session.user.email,
        planId: plan.id,
        credits: String(plan.credits)
      }
    };

    const subscription = await razorpay.subscriptions.create(options as any) as any;

    return NextResponse.json({
        success: true,
        orderId: subscription.id,
        isSubscription: true,
        amount: amountInSmallestUnit,
        currency: currency || "INR",
        keyId: process.env.RAZORPAY_KEY_ID
    });

  } catch (e: unknown) {
    console.error("Payment Order Error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
  }
}
