import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "pre_flight_compiler_secret_token_aes_256_gcm_node_omega"
);

export async function POST() {
  try {
    const guestId = `guest_${Math.random().toString(36).substring(2, 11)}`;

    const token = await new SignJWT({
      identifier: guestId,
      role: "guest",
      credits: 3, // Standard free compressions per day limit
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("12h") // shorter expiry for guests
      .sign(secret);

    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 12, // 12 hours
      path: "/",
    });

    return NextResponse.json({ success: true, role: "guest" });
  } catch (error) {
    return NextResponse.json(
      { error: "GUEST_PROVISIONING_ERROR" },
      { status: 500 }
    );
  }
}
