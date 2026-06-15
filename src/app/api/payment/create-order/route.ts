import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const isProd = process.env.NODE_ENV === "production";
const keyId = process.env.RAZORPAY_KEY_ID || (isProd ? "" : "rzp_test_mock_keys_123");
const keySecret = process.env.RAZORPAY_KEY_SECRET || (isProd ? "" : "mock_secret_123");

// Initialize Razorpay SDK.
// During local/sandbox testing, if real keys are missing, we mock the responses.
const razorpay = new Razorpay({
  key_id: keyId || "dummy_key",
  key_secret: keySecret || "dummy_secret",
});

export async function POST(request: Request) {
  try {
    const { planId, amount } = await request.json();

    if (!planId || !amount) {
      return NextResponse.json(
        { error: "PLAN_ID_AND_AMOUNT_REQUIRED" },
        { status: 400 }
      );
    }

    console.log(`[PAYMENT] Initializing payment sequence for plan ${planId}, total: ₹${amount}`);

    // If using the default mock keys, bypass SDK call and return a mock order
    if (keyId === "rzp_test_mock_keys_123" && !isProd) {
      return NextResponse.json({
        orderId: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
        amount: Math.round(amount * 100),
        currency: "INR",
        mock: true,
      });
    }

    // Call official Razorpay Orders API
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // amount in paise
      currency: "INR",
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
