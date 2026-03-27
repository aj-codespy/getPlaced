import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, doc, increment, runTransaction, serverTimestamp } from "firebase/firestore";
import { verifyDodoWebhookSignature } from "@/lib/payments/dodo";
import { BillingCurrency, findPlanByDodoProductId, findPlanById } from "@/lib/razorpay/pricing";

type JsonObj = Record<string, unknown>;

type DodoWebhookEvent = {
  type?: string;
  event_type?: string;
  data?: JsonObj;
} & JsonObj;

function getObject(value: unknown): JsonObj {
  return typeof value === "object" && value !== null ? (value as JsonObj) : {};
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function inferProductId(payload: JsonObj) {
  const direct = getString(payload.product_id);
  if (direct) return direct;

  const subscription = getObject(payload.subscription);
  const subProduct = getString(subscription.product_id);
  if (subProduct) return subProduct;

  const cart = Array.isArray(payload.product_cart) ? payload.product_cart : [];
  const first = getObject(cart[0]);
  return getString(first.product_id);
}

function parseCurrency(raw: unknown): BillingCurrency {
  return raw === "INR" ? "INR" : "USD";
}

function parseEvent(payload: DodoWebhookEvent) {
  const eventType = getString(payload.type || payload.event_type);
  const data = getObject(payload.data);
  const metadata = getObject(data.metadata);
  const userEmail = getString(metadata.userEmail || metadata.user_email || getObject(data.customer).email).toLowerCase();
  const currency = parseCurrency(data.currency || metadata.currency);
  const productId = inferProductId(data);
  const plan =
    findPlanById(getString(metadata.planId || metadata.plan_id)) || (productId ? findPlanByDodoProductId(productId) : undefined);

  return {
    eventType,
    data,
    metadata,
    userEmail,
    currency,
    productId,
    plan,
    paymentId: getString(data.payment_id),
    subscriptionId: getString(data.subscription_id),
    customerId: getString(getObject(data.customer).customer_id),
    customerEmail: getString(getObject(data.customer).email).toLowerCase(),
    status: getString(data.status),
  };
}

function isSubscriptionActiveEvent(eventType: string) {
  return ["subscription.active", "subscription.updated", "subscription.renewed", "subscription.plan_changed"].includes(eventType);
}

function isSubscriptionInactiveEvent(eventType: string) {
  return ["subscription.cancelled", "subscription.failed", "subscription.expired", "subscription.on_hold"].includes(eventType);
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const webhookId = req.headers.get("webhook-id") || "";
  const webhookTimestamp = req.headers.get("webhook-timestamp") || "";
  const webhookSignature = req.headers.get("webhook-signature") || "";

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return NextResponse.json({ error: "Missing webhook headers" }, { status: 400 });
  }

  const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY || "";
  if (!webhookKey) {
    return NextResponse.json({ error: "Webhook key is not configured" }, { status: 500 });
  }

  const isValid = verifyDodoWebhookSignature({
    rawBody,
    webhookId,
    webhookTimestamp,
    webhookSignature,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let parsedBody: DodoWebhookEvent;
  try {
    parsedBody = JSON.parse(rawBody) as DodoWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const parsed = parseEvent(parsedBody);
  if (!parsed.eventType) {
    return NextResponse.json({ error: "Missing event type" }, { status: 400 });
  }

  try {
    const eventRef = doc(collection(db, "webhook_events"), `dodo_${webhookId}`);

    let duplicate = false;
    let ignored = false;

    await runTransaction(db, async (tx) => {
      const existingEvent = await tx.get(eventRef);
      if (existingEvent.exists()) {
        duplicate = true;
        return;
      }

      tx.set(eventRef, {
        provider: "dodo",
        webhookId,
        eventType: parsed.eventType,
        userEmail: parsed.userEmail || parsed.customerEmail || null,
        createdAt: serverTimestamp(),
      });

      if (parsed.eventType === "payment.succeeded") {
        if (!parsed.userEmail || !parsed.plan) {
          throw new Error("Unable to resolve user or plan from payment event");
        }

        const paymentRef = doc(collection(db, "transactions"), `dodo_${parsed.paymentId || webhookId}`);
        const existingPayment = await tx.get(paymentRef);
        if (existingPayment.exists()) {
          return;
        }

        const amountFromPayload =
          typeof parsed.data.total_amount === "number"
            ? parsed.data.total_amount
            : Math.round(parsed.plan.price[parsed.currency] * 100);

        tx.set(paymentRef, {
          provider: "dodo",
          type: "subscription",
          status: "success",
          paymentId: parsed.paymentId || null,
          subscriptionId: parsed.subscriptionId || null,
          userId: parsed.userEmail,
          userEmail: parsed.userEmail,
          customerId: parsed.customerId || null,
          planId: parsed.plan.id,
          planType: parsed.plan.planType,
          productId: parsed.productId || null,
          currency: parsed.currency,
          amount: amountFromPayload,
          creditsAdded: parsed.plan.credits,
          eventType: parsed.eventType,
          createdAt: serverTimestamp(),
          metadata: parsed.metadata,
        });

        const userRef = doc(db, "users", parsed.userEmail);
        tx.set(
          userRef,
          {
            credits: increment(parsed.plan.credits),
            planType: parsed.plan.planType,
            isPremium: parsed.plan.isPremium,
            subscriptionActive: true,
            subscriptionId: parsed.subscriptionId || null,
            subscriptionProvider: "dodo",
            subscriptionStatus: parsed.status || "active",
            lastPaymentProvider: "dodo",
            lastPaymentId: parsed.paymentId || null,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        return;
      }

      if (isSubscriptionActiveEvent(parsed.eventType) || isSubscriptionInactiveEvent(parsed.eventType)) {
        const targetEmail = parsed.userEmail || parsed.customerEmail;
        if (!targetEmail) {
          ignored = true;
          return;
        }

        const userRef = doc(db, "users", targetEmail);
        tx.set(
          userRef,
          {
            subscriptionProvider: "dodo",
            subscriptionId: parsed.subscriptionId || null,
            subscriptionActive: isSubscriptionActiveEvent(parsed.eventType),
            subscriptionStatus: parsed.status || parsed.eventType.replace("subscription.", ""),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
        return;
      }

      ignored = true;
    });

    if (duplicate) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    if (ignored) {
      return NextResponse.json({ success: true, ignored: true });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error("Dodo webhook processing failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Webhook processing failed" },
      { status: 500 },
    );
  }
}

