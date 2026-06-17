import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS_URL = "https://ep-bold-frog-ao5uzymm.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth/.well-known/jwks.json";

let jwksStore: any = null;

function getJwks() {
  if (!jwksStore) {
    jwksStore = createRemoteJWKSet(new URL(JWKS_URL));
  }
  return jwksStore;
}

export const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev_only_temporary_secret_key_not_for_production_usage"
);

export function getJwtSecret() {
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("CRITICAL: JWT_SECRET environment variable is missing in production environment!");
  }
  return JWT_SECRET_KEY;
}

export async function verifyNeonToken(token: string) {
  if (!token) return null;

  // In test/development environment, support verifying mock/test tokens locally
  if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development") {
    if (token.startsWith("mock_")) {
      try {
        const parts = token.split(".");
        const payloadStr = Buffer.from(parts[1] || "", "base64").toString("utf-8");
        return JSON.parse(payloadStr);
      } catch {
        // fallback
      }
    }
    // Also allow verifying local tokens signed with the secret key for test compatibility
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
      return payload;
    } catch {
      // fallback to JWKS
    }
  }

  try {
    const jwks = getJwks();
    const { payload } = await jwtVerify(token, jwks);
    return payload;
  } catch (err) {
    console.error("[NEON_AUTH] Token verification failed:", err);
    return null;
  }
}

import { auth } from "@/lib/auth/server";
import { cookies, headers } from "next/headers";

export async function getSessionUser(): Promise<{ userId: string; role: string } | null> {
  // 1. Try checking the official SDK session first
  try {
    const sdkSession = await auth.getSession();
    if (sdkSession && 'data' in sdkSession && sdkSession.data?.user) {
      const user = sdkSession.data.user;
      return {
        userId: (user.email || user.id || "").toLowerCase(),
        role: (user.role as string) || "candidate",
      };
    }
  } catch (err) {
    console.error("[GET_SESSION_USER] SDK session check failed:", err);
  }

  // 2. Fallback to guest token
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session") || cookieStore.get("__session") || cookieStore.get("__client_token");
    let token = sessionCookie?.value || "";

    if (!token) {
      const reqHeaders = await headers();
      const authHeader = reqHeaders.get("authorization") || "";
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const payload = await verifyNeonToken(token);
      if (payload) {
        const userId = (
          (payload.email as string) ||
          (payload.sub as string) ||
          (payload.email_address as string) ||
          (payload.username as string) ||
          (payload.identifier as string) ||
          "guest_user"
        ).toLowerCase();
        const role = (payload.role as string) || "guest";
        return { userId, role };
      }
    }
  } catch (err) {
    console.error("[GET_SESSION_USER] Guest token verification failed:", err);
  }

  return null;
}
