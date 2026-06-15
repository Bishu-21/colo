import { NextResponse } from "next/server";
import crypto from "crypto";
import { logTransactionLedger } from "@/lib/ledger";

const isProd = process.env.NODE_ENV === "production";
const keySecret = process.env.RAZORPAY_KEY_SECRET || (isProd ? "" : "mock_secret_123");

/**
 * Handles Razorpay secure webhook events (e.g. payment.captured)
 * to asynchronously sync credit balances if the client-side session closes.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "MISSING_SIGNATURE" },
        { status: 400 }
      );
    }

    // Verify webhook payload integrity
    const expectedSignature = crypto
      .createHmac("sha256", keySecret || "dummy_secret")
      .update(rawBody)
      .digest("hex");

    const isMock = keySecret === "mock_secret_123" && !isProd;
    const isSignatureValid = isMock || (expectedSignature === signature && !!keySecret);

    if (!isSignatureValid) {
      return NextResponse.json(
        { error: "INVALID_WEBHOOK_SIGNATURE" },
        { status: 400 }
      );
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    // Verify event capture action
    if (event === "payment.captured") {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const amount = paymentEntity.amount / 100; // convert paise to INR
      
      const notes = paymentEntity.notes || {};
      const planId = notes.planId || "csc";
      const userId = notes.userId || "guest_user";

      // PERSIST IN AUDIT LEDGER
      await logTransactionLedger(
        userId,
        amount,
        "CREDIT",
        `WEBHOOK_ACTIVATED_PLAN_${planId.toUpperCase()}`,
        paymentId
      );

      console.log(`[PAYMENT WEBHOOK SUCCESS] Logged transaction ${paymentId} for order ${orderId}`);
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("[PAYMENT_WEBHOOK_ERROR]", error);
    return NextResponse.json(
      { error: "INTERNAL_WEBHOOK_VERIFICATION_FAILED" },
      { status: 500 }
    );
  }
}
