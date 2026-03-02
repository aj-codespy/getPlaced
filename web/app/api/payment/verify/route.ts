
import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, increment, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { PRICING_PLANS } from "@/lib/razorpay/pricing";

export async function POST(req: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      userEmail
    } = await req.json();

    // 1. Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid Signature" }, { status: 400 });
    }

    // 2. Identify Credits to Add
    const plan = Object.values(PRICING_PLANS).find((p) => p.id === planId);
    if (!plan) {
         return NextResponse.json({ error: "Invalid Plan Reference" }, { status: 400 });
    }

    // 3. Update User Balance in Firestore
    const userRef = doc(db, "users", userEmail);
    
    // Add transaction record
    await addDoc(collection(db, "transactions"), {
        userId: userEmail,
        planId: planId,
        amount: plan.price.INR, // Or USD, logic simplified here
        creditsAdded: plan.credits,
        provider: "razorpay",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        createdAt: serverTimestamp(),
        status: "success"
    });

    // Increment Credits & Set Plan
    const isPremiumValue = planId === "plan_pro" ? 2 : 1;
    
    await updateDoc(userRef, {
        credits: increment(plan.credits),
        planType: planId === "plan_pro" ? "pro" : "standard",
        isPremium: isPremiumValue,
        updatedAt: serverTimestamp()
    });

    return NextResponse.json({ success: true, message: "Payment Verified & Credits Added" });

  } catch (e: unknown) {
    console.error("Payment Verification Error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
  }
}
