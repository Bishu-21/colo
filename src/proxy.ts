import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyNeonToken } from "@/utils/authConfig";
import { auth } from "@/lib/auth/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Extract token from cookies or authorization header
  const sessionCookie = request.cookies.get("session") || request.cookies.get("__session") || request.cookies.get("__client_token");
  let token = sessionCookie?.value || "";

  if (!token) {
    const authHeader = request.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  let isAuthenticated = false;

  // Optimize: Check if there's any active session cookie or authorization header.
  // If not, we skip the upstream Neon Auth API request to prevent prefetch latency.
  const hasBetterAuthCookie = Array.from(request.cookies.getAll()).some(c => c.name.startsWith("better-auth"));
  const hasCredentials = !!token || hasBetterAuthCookie;

  if (hasCredentials) {
    // 1. Check official SDK session (for registered users)
    try {
      const sdkSession = await auth.getSession();
      if (sdkSession && 'data' in sdkSession && sdkSession.data?.user) {
        isAuthenticated = true;
      }
    } catch (err) {
      console.error("[PROXY_AUTH] SDK Session retrieval failed:", err);
    }

    // 2. Check local fallback (for guests)
    if (!isAuthenticated && token) {
      const payload = await verifyNeonToken(token);
      if (payload) {
        isAuthenticated = true;
      }
    }
  }

  // Safe redirect helper using Next.js native redirection
  const handleRedirect = (destinationPath: string) => {
    const destinationUrl = new URL(destinationPath, request.url).toString();
    return NextResponse.redirect(destinationUrl);
  };

  // Protect mutation APIs
  const protectedMutationAPIs = [
    "/api/share",
    "/api/reviews",
    "/api/image/process",
    "/api/image/unlock",
    "/api/payment/create-order",
    "/api/payment/verify",
  ];
  const isProtectedAPI = protectedMutationAPIs.includes(pathname);

  if (isProtectedAPI && request.method !== "GET" && request.method !== "OPTIONS") {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "UNAUTHORIZED_API_ACCESS" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Define paths that require authentication
  const protectedPaths = ["/workspace", "/ops", "/settings", "/billing"];
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (isProtected) {
    if (!isAuthenticated) {
      const isPrefetch = request.headers.get("next-router-prefetch") === "1" ||
                         request.headers.get("purpose") === "prefetch";
      if (isPrefetch) {
        return new NextResponse(null, {
          status: 204,
          headers: {
            "x-middleware-cache": "no-cache",
          },
        });
      }
      const redirectUrl = encodeURIComponent(pathname + request.nextUrl.search);
      return handleRedirect(`/auth/sign-in?redirect=${redirectUrl}`);
    }
    return NextResponse.next();
  }

  // Handle path redirects for home and auth endpoints
  if (pathname === "/auth") {
    if (isAuthenticated) {
      return handleRedirect("/workspace");
    }
    return handleRedirect("/auth/sign-in");
  }

  if (pathname === "/") {
    if (isAuthenticated) {
      return handleRedirect("/workspace");
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/workspace/:path*",
    "/ops",
    "/settings",
    "/billing",
    "/auth",
    "/",
    "/api/share",
    "/api/reviews",
    "/api/image/process",
    "/api/image/unlock",
    "/api/payment/create-order",
    "/api/payment/verify",
  ],
};
