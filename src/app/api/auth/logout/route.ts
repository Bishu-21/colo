import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  
  // Clear all possible Neon Auth & general session cookies
  const sessionCookies = ["session", "__session", "__client_token"];
  for (const c of sessionCookies) {
    cookieStore.set(c, "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });
  }

  return NextResponse.json({ success: true });
}
