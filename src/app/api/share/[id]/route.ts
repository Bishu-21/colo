import { NextResponse } from "next/server";
import { passiveCleanup } from "@/utils/shareCleanup";
import { getShare, saveShare, deleteShare } from "@/utils/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "SHARE_ID_REQUIRED" }, { status: 400 });
    }

    const payload = await getShare(id);
    if (!payload) {
      return NextResponse.json({ error: "SHARE_NOT_FOUND" }, { status: 404 });
    }

    const now = Date.now();

    // Check expiration
    if (payload.expiresAt && now > payload.expiresAt) {
      await deleteShare(id);
      return NextResponse.json({ error: "SHARE_EXPIRED" }, { status: 410 });
    }

    // Check if download limit already reached
    if (payload.downloadLimit > 0 && payload.downloadCount >= payload.downloadLimit) {
      await deleteShare(id);
      return NextResponse.json({ error: "SHARE_EXPIRED" }, { status: 410 });
    }

    // Clean up other expired shares on this request to prevent storage accumulation (passive worker)
    passiveCleanup().catch(err => console.error("[SHARE_CLEANUP_ERROR]", err));

    return NextResponse.json({
      ciphertext: payload.ciphertext,
      iv: payload.iv,
      metadata: payload.metadata,
      expiresAt: payload.expiresAt,
      downloadLimit: payload.downloadLimit,
      downloadCount: payload.downloadCount,
    });
  } catch (error) {
    console.error("[SHARE_GET_ERROR]", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "SHARE_ID_REQUIRED" }, { status: 400 });
    }

    const payload = await getShare(id);
    if (!payload) {
      return NextResponse.json({ error: "SHARE_NOT_FOUND" }, { status: 404 });
    }

    const now = Date.now();
    if (payload.expiresAt && now > payload.expiresAt) {
      await deleteShare(id);
      return NextResponse.json({ error: "SHARE_EXPIRED" }, { status: 410 });
    }

    if (payload.downloadLimit > 0 && payload.downloadCount >= payload.downloadLimit) {
      await deleteShare(id);
      return NextResponse.json({ error: "SHARE_EXPIRED" }, { status: 410 });
    }

    payload.downloadCount += 1;
    const limitReached = payload.downloadLimit > 0 && payload.downloadCount >= payload.downloadLimit;

    if (limitReached) {
      await deleteShare(id);
      console.log(`[SHARE_LIMIT] Purged share ${id} due to limit cap: ${payload.downloadLimit}`);
    } else {
      await saveShare(payload);
    }

    return NextResponse.json({ success: true, downloadCount: payload.downloadCount });
  } catch (error) {
    console.error("[SHARE_POST_DOWNLOAD_ERROR]", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", details: (error as Error).message },
      { status: 500 }
    );
  }
}

