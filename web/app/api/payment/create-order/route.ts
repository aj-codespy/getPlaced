import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dodoApiRequest } from "@/lib/payments/dodo";
import { BillingCurrency, findPlanById, getDodoProductId } from "@/lib/razorpay/pricing";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await req.json().catch(() => ({}))) as { planId?: string; currency?: BillingCurrency };
    const planId = payload.planId || "";
    const currency: BillingCurrency = payload.currency === "INR" ? "INR" : "USD";

    const plan = findPlanById(planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid Plan ID" }, { status: 400 });
    }

    const productId = getDodoProductId(plan.id, currency);
    if (!productId) {
      return NextResponse.json({ error: "Product ID missing for selected plan/currency" }, { status: 500 });
    }

    const appBaseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const returnUrl = `${appBaseUrl}/dashboard?payment=dodo_return`;
    const cancelUrl = `${appBaseUrl}/pricing?payment=cancelled`;
    const allowedMethods =
      currency === "INR" ? ["credit", "debit", "upi_collect", "upi_intent"] : ["credit", "debit"];

    const checkoutPayload = {
      product_cart: [{ product_id: productId, quantity: 1 }],
      billing_currency: currency,
      allowed_payment_method_types: allowedMethods,
      customer: {
        email: session.user.email.toLowerCase(),
        name: session.user.name || undefined,
      },
      metadata: {
        source: "getplaced_web",
        userEmail: session.user.email.toLowerCase(),
        planId: plan.id,
        planType: plan.planType,
        currency,
      },
      return_url: returnUrl,
      cancel_url: cancelUrl,
    };

    const dodoResponse = await dodoApiRequest("/checkouts", checkoutPayload);
    const checkoutUrl = typeof dodoResponse.checkout_url === "string" ? dodoResponse.checkout_url : "";
    const sessionId = typeof dodoResponse.session_id === "string" ? dodoResponse.session_id : "";

    if (!checkoutUrl) {
      return NextResponse.json({ error: "Failed to create checkout URL" }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      provider: "dodo",
      checkoutUrl,
      sessionId,
      planId: plan.id,
      currency,
    });
  } catch (e: unknown) {
    console.error("Dodo checkout creation failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 },
    );
  }
}
