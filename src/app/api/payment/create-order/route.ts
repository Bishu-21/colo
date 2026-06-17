import { NextResponse } from "next/server";
import { getSessionUser } from "@/utils/authConfig";
import Razorpay from "razorpay";

const isProd = process.env.NODE_ENV === "production";
const keyId = process.env.RAZORPAY_KEY_ID || (isProd ? "" : "rzp_test_mock_keys_123");
const keySecret = process.env.RAZORPAY_KEY_SECRET || (isProd ? "" : "mock_secret_123");

const razorpay = new Razorpay({
  key_id: keyId || "dummy_key",
  key_secret: keySecret || "dummy_secret",
});

const SERVER_PLANS: Record<string, { price: number; name: string }> = {
  "candidate": { price: 49, name: "Candidate Pass (Single Season)" },
  "csc": { price: 499, name: "CSC Operator Subscription (Monthly)" },
  "enterprise": { price: 999, name: "Enterprise API SDK (Pay-As-You-Go)" }
};

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }


    const { planId, currency = "INR" } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: "PLAN_ID_REQUIRED" },
        { status: 400 }
      );
    }

    const plan = SERVER_PLANS[planId];
    if (!plan) {
      return NextResponse.json(
        { error: "INVALID_PLAN_ID" },
        { status: 400 }
      );
    }

    // Server-side price calculation: base price + 18% GST
    const basePrice = plan.price;
    const gst = Math.round(basePrice * 0.18 * 100) / 100;
    const amount = Math.round((basePrice + gst) * 100) / 100;

    console.log(`[PAYMENT] Initializing payment sequence for plan ${planId}, total: ${currency} ${amount}`);

    // If using the default mock keys, bypass SDK call and return a mock order
    if (keyId === "rzp_test_mock_keys_123" && !isProd) {
      return NextResponse.json({
        orderId: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
        amount: Math.round(amount * 100),
        currency,
        mock: true,
      });
    }


    // Call official Razorpay Orders API
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // amount in paise/cents
      currency,
      receipt: `receipt_${Date.now()}_${planId}`,
      notes: {
        planId,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      mock: false,
    });
  } catch (error) {
    const err = error as Error;
    console.error("[PAYMENT_ERROR] Razorpay Order Creation failed:", err);
    return NextResponse.json(
      { error: "GATEWAY_INITIALIZATION_ERROR", details: err.message },
      { status: 500 }
    );
  }
}
