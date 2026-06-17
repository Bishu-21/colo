import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { getUser, saveUser } from "@/utils/db";
import { logTransactionLedger } from "@/lib/ledger";
import { getSQL } from "@/utils/neonDb";
import { getSessionUser } from "@/utils/authConfig";

const isProd = process.env.NODE_ENV === "production";
const keySecret = process.env.RAZORPAY_KEY_SECRET || (isProd ? "" : "mock_secret_123");

const SERVER_PLANS: Record<string, { price: number; name: string }> = {
  "candidate": { price: 49, name: "Candidate Pass (Single Season)" },
  "csc": { price: 499, name: "CSC Operator Subscription (Monthly)" },
  "enterprise": { price: 999, name: "Enterprise API SDK (Pay-As-You-Go)" }
};

export async function POST(request: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      amount,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !planId) {
      return NextResponse.json(
        { error: "MISSING_TRANSACTION_PAYLOAD" },
        { status: 400 }
      );
    }

    // 1. Enforce Server-Side Auth Check
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { userId, role } = sessionUser;

    let currentCredits = 3;
    let currentRole = role;
    
    // Fetch latest user details from DB
    const dbUser = await getUser(userId);
    if (dbUser) {
      currentCredits = dbUser.credits;
      currentRole = dbUser.role;
    }

    // 2. Make Payment Verification Idempotent
    const sql = getSQL();
    const existingTx = await sql`SELECT * FROM transactions WHERE external_ref = ${razorpay_payment_id} LIMIT 1`;
    if (existingTx.length > 0) {
      const dbUser = await getUser(userId.toLowerCase());
      const resCredits = dbUser ? dbUser.credits : currentCredits;
      const resRole = dbUser ? dbUser.role : currentRole;
      return NextResponse.json({
        success: true,
        role: resRole,
        credits: resCredits,
        idempotentBypass: true,
      });
    }

    const plan = SERVER_PLANS[planId];
    if (!plan) {
      return NextResponse.json(
        { error: "INVALID_PLAN_ID" },
        { status: 400 }
      );
    }

    const basePrice = plan.price;
    const gst = Math.round(basePrice * 0.18 * 100) / 100;
    const expectedAmount = Math.round((basePrice + gst) * 100) / 100;

    // Reject mismatch or manipulation attempts
    if (Math.abs(amount - expectedAmount) > 0.01) {
      return NextResponse.json(
        { error: "PAYMENT_AMOUNT_MISMATCH" },
        { status: 400 }
      );
    }


    // Verify signature using SHA-256 HMAC
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret || "dummy_secret")
      .update(text)
      .digest("hex");

    const isMock = razorpay_order_id.startsWith("order_mock_") && !isProd;
    const isSignatureValid = isMock || (generatedSignature === razorpay_signature && !!keySecret);

    if (!isSignatureValid) {
      return NextResponse.json(
        { error: "PAYMENT_SIGNATURE_MISMATCH" },
        { status: 400 }
      );
    }


    // Double-entry cryptographic audit log writing
    await logTransactionLedger(
      userId,
      expectedAmount,
      "CREDIT",
      `ACTIVATED_PLAN_${planId.toUpperCase()}`,
      razorpay_payment_id
    );


    // Compute updated credit allocation
    let addedCredits = 3;
    let newRole = currentRole;
    
    if (planId === "single-photo") {
      addedCredits = 5;
      newRole = "candidate";
    } else if (planId === "candidate") {
      addedCredits = 100;
      newRole = "candidate";
    } else if (planId === "csc") {
      addedCredits = 1000;
      newRole = "operator";
    } else if (planId === "enterprise") {
      addedCredits = 10000;
      newRole = "enterprise";
    }

    // Update user credits persistently in the database
    let finalCredits = currentCredits + addedCredits;
    if (userId !== "guest_user") {
      const cleanId = userId.toLowerCase();
      let dbUser = await getUser(cleanId);
      if (!dbUser) {
        dbUser = await saveUser({
          identifier: cleanId,
          role: newRole,
          credits: finalCredits,
        });
      } else {
        dbUser.credits += addedCredits;
        // Upgrade role matching purchases
        if (newRole !== "guest" && dbUser.role === "guest") {
          dbUser.role = newRole;
        } else if (planId === "csc") {
          dbUser.role = "operator";
        } else if (planId === "enterprise") {
          dbUser.role = "enterprise";
        }
        dbUser = await saveUser(dbUser);
      }
      finalCredits = dbUser.credits;
      newRole = dbUser.role;
    }

    return NextResponse.json({
      success: true,
      role: newRole,
      credits: finalCredits,
    });
  } catch (error) {
    console.error("[PAYMENT_VERIFY_ERROR]", error);
    return NextResponse.json(
      { error: "INTERNAL_TRANSACTION_VERIFICATION_FAILED" },
      { status: 500 }
    );
  }
}
