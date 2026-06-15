import { NextResponse } from "next/server";
import crypto from "crypto";
import { logTransactionLedger } from "@/lib/ledger";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const isProd = process.env.NODE_ENV === "production";
const keySecret = process.env.RAZORPAY_KEY_SECRET || (isProd ? "" : "mock_secret_123");
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "pre_flight_compiler_secret_token_aes_256_gcm_node_omega"
);

export async function POST(request: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      amount,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json(
        { error: "MISSING_TRANSACTION_PAYLOAD" },
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

    // Decode session payload
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
    let userId = "guest_user";
    let currentCredits = 3;
    let currentRole = "guest";

    if (sessionCookie) {
      try {
        const { payload } = await jwtVerify(sessionCookie.value, secret);
        userId = (payload.identifier as string) || "guest_user";
        currentCredits = (payload.credits as number) || 3;
        currentRole = (payload.role as string) || "guest";
      } catch {
        // Fallback to guest
      }
    }

    // Double-entry cryptographic audit log writing
    await logTransactionLedger(
      userId,
      amount,
      "CREDIT",
      `ACTIVATED_PLAN_${planId.toUpperCase()}`,
      razorpay_payment_id
    );

    // Compute updated credit allocation
    let addedCredits = 3;
    let newRole = currentRole;
    
    if (planId === "candidate") {
      addedCredits = 100;
      newRole = "candidate";
    } else if (planId === "csc") {
      addedCredits = 1000;
      newRole = "operator";
    } else if (planId === "enterprise") {
      addedCredits = 10000;
      newRole = "enterprise";
    }

    // Issue updated session token
    const token = await new SignJWT({
      identifier: userId,
      role: newRole,
      credits: currentCredits + addedCredits,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(secret);

    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      role: newRole,
      credits: currentCredits + addedCredits,
    });
  } catch (error) {
    console.error("[PAYMENT_VERIFY_ERROR]", error);
    return NextResponse.json(
      { error: "INTERNAL_TRANSACTION_VERIFICATION_FAILED" },
      { status: 500 }
    );
  }
}
