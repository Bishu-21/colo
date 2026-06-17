import { NextResponse } from "next/server";
import { getSessionUser } from "@/utils/authConfig";
import { passiveCleanup } from "@/utils/shareCleanup";
import { saveShare, checkRateLimit } from "@/utils/db";

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { userId } = sessionUser;


    // Rate limiting: 10 shares per minute
    const isLimited = await checkRateLimit(`share:${userId}`, 10, 60);
    if (isLimited) {
      return NextResponse.json({ error: "TOO_MANY_REQUESTS" }, { status: 429 });
    }

    const body = await request.json();
    const { ciphertext, iv, metadata, expirationMinutes, downloadLimit } = body;

    if (!ciphertext || !iv || !metadata) {
      return NextResponse.json(
        { error: "MISSING_ENCRYPTED_PAYLOAD" },
        { status: 400 }
      );
    }


    // Generate a unique ID (secure random alphanumeric)
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Calculate expiration time
    const minutes = parseInt(expirationMinutes) || 60; // default to 60 minutes
    const expiresAt = Date.now() + minutes * 60 * 1000;

    const shareData = {
      id,
      ciphertext,
      iv,
      metadata,
      expiresAt,
      downloadLimit: parseInt(downloadLimit) || 0, // 0 means unlimited
      downloadCount: 0,
      userId,
    };

    // Save share records to Neon PostgreSQL database
    await saveShare(shareData);

    // Clean up other expired shares on this request to prevent storage accumulation (passive worker)
    passiveCleanup().catch(err => console.error("[SHARE_CLEANUP_ERROR]", err));

    return NextResponse.json({
      success: true,
      id,
      expiresAt,
    });
  } catch (error) {
    console.error("[SHARE_POST_ERROR]", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", details: (error as Error).message },
      { status: 500 }
    );
  }
}
