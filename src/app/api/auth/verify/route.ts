import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "pre_flight_compiler_secret_token_aes_256_gcm_node_omega"
);

export async function POST(request: Request) {
  try {
    const { identifier, code, type } = await request.json();

    if (!identifier || !code) {
      return NextResponse.json(
        { error: "IDENTIFIER_AND_CODE_REQUIRED" },
        { status: 400 }
      );
    }

    // Standard local testing bypass code
    if (code !== "123456") {
      return NextResponse.json(
        { error: "INVALID_OTP_SEQUENCE" },
        { status: 401 }
      );
    }

    // Compile JWT payload
    const token = await new SignJWT({
      identifier: identifier.trim(),
      role: type === "operator" ? "operator" : "candidate",
      credits: type === "operator" ? 1000 : 3, // Initial free tier credits
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(secret);

    // Set secure cookie
    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return NextResponse.json({ success: true, role: type });
  } catch (error) {
    return NextResponse.json(
      { error: "VERIFICATION_SYSTEM_ERROR" },
      { status: 500 }
    );
  }
}
