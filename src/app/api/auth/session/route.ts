import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { verifyNeonToken } from "@/utils/authConfig";
import { getUser, saveUser } from "@/utils/db";
import { auth } from "@/lib/auth/server";

export async function GET() {
  try {
    // 1. Try checking the official SDK session first
    let sdkSession = null;
    try {
      sdkSession = await auth.getSession();
    } catch (err) {
      console.error("[SESSION_ROUTE] SDK Session retrieval failed:", err);
    }

    let identifier = "";
    let role = "";
    let name = "";

    if (sdkSession && 'data' in sdkSession && sdkSession.data?.user) {
      const user = sdkSession.data.user;
      identifier = (user.email || user.id || "").toLowerCase();
      role = (user.role as string) || "candidate";
      name = user.name || "";
    } else {
      // 2. Fallback to guest token
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("session") || cookieStore.get("__session") || cookieStore.get("__client_token");
      let token = sessionCookie?.value || "";

      if (!token) {
        // Check Authorization header
        const reqHeaders = await headers();
        const authHeader = reqHeaders.get("authorization") || "";
        if (authHeader.startsWith("Bearer ")) {
          token = authHeader.substring(7);
        }
      }

      if (!token) {
        return NextResponse.json({
          authenticated: false,
          role: "guest_anonymous",
          credits: 0,
        });
      }

      const payload = await verifyNeonToken(token);
      if (!payload) {
        return NextResponse.json({
          authenticated: false,
          role: "guest_anonymous",
          credits: 0,
        });
      }

      identifier = (
        (payload.email as string) ||
        (payload.sub as string) ||
        (payload.email_address as string) ||
        (payload.username as string) ||
        (payload.identifier as string) ||
        ""
      ).toLowerCase();
      role = (payload.role as string) || "guest";
      name = (payload.name as string) || (payload.display_name as string) || "";
    }

    if (!identifier) {
      return NextResponse.json({
        authenticated: false,
        role: "guest_anonymous",
        credits: 0,
      });
    }

    let credits = 3; // default credits

    // Sync or auto-provision with DB
    let dbUser = await getUser(identifier);
    if (!dbUser) {
      dbUser = await saveUser({
        identifier,
        role,
        credits,
        display_name: name || undefined,
      });
    }

    return NextResponse.json({
      authenticated: true,
      identifier: dbUser.identifier,
      role: dbUser.role,
      credits: dbUser.credits,
    });
  } catch (err) {
    console.error("[SESSION_ROUTE] Error:", err);
    return NextResponse.json({
      authenticated: false,
      role: "guest_anonymous",
      credits: 0,
    });
  }
}
