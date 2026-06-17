import { NextResponse } from "next/server";
import crypto from "crypto";
import { logTransactionLedger } from "@/lib/ledger";
import { getUser, saveUser } from "@/utils/db";
import { getSQL } from "@/utils/neonDb";

const isProd = process.env.NODE_ENV === "production";
const keySecret = process.env.RAZORPAY_KEY_SECRET || (isProd ? "" : "mock_secret_123");

if (isProd && !process.env.RAZORPAY_KEY_SECRET) {
  console.warn("[WARN] RAZORPAY_KEY_SECRET is missing in production environment. Webhook verification will fail.");
}

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

      // Idempotency check: verify if this paymentId has already been recorded
      const sql = getSQL();
      const existingTx = await sql`SELECT * FROM transactions WHERE external_ref = ${paymentId} LIMIT 1`;
      if (existingTx.length > 0) {
        console.log(`[PAYMENT WEBHOOK IDEMPOTENT] Already processed webhook transaction ${paymentId}`);
        return NextResponse.json({ success: true, alreadyProcessed: true });
      }


      // PERSIST IN AUDIT LEDGER
      await logTransactionLedger(
        userId,
        amount,
        "CREDIT",
        `WEBHOOK_ACTIVATED_PLAN_${planId.toUpperCase()}`,
        paymentId
      );

      // Persist credits update in DB for serverless fallback
      if (userId && userId !== "guest_user") {
        const cleanId = userId.toLowerCase();
        let dbUser = await getUser(cleanId);
        let addedCredits = 3;
        let targetRole = "candidate";

        if (planId === "single-photo") {
          addedCredits = 5;
          targetRole = "candidate";
        } else if (planId === "candidate") {
          addedCredits = 100;
          targetRole = "candidate";
        } else if (planId === "csc") {
          addedCredits = 1000;
          targetRole = "operator";
        } else if (planId === "enterprise") {
          addedCredits = 10000;
          targetRole = "enterprise";
        }

        if (!dbUser) {
          await saveUser({
            identifier: cleanId,
            role: targetRole,
            credits: addedCredits,
          });
        } else {
          dbUser.credits += addedCredits;
          if (targetRole !== "candidate" || dbUser.role === "guest") {
            dbUser.role = targetRole;
          }
          await saveUser(dbUser);
        }
      }

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
