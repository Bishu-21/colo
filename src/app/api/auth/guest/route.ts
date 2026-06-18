import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getJwtSecretKey } from "@/utils/authConfig";

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
      .sign(getJwtSecretKey());

    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 12, // 12 hours
      path: "/",
    });

    return NextResponse.json({ success: true, role: "guest" });
  } catch {
    return NextResponse.json(
      { error: "GUEST_PROVISIONING_ERROR" },
      { status: 500 }
    );
  }
}
