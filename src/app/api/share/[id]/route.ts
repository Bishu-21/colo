import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const SHARES_DIR = path.join(process.cwd(), "data", "shares");

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "SHARE_ID_REQUIRED" }, { status: 400 });
    }

    const filePath = path.join(SHARES_DIR, `${id}.json`);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: "SHARE_NOT_FOUND" }, { status: 404 });
    }

    const data = await fs.readFile(filePath, "utf8");
    const payload = JSON.parse(data);
    const now = Date.now();

    // Check expiration
    if (payload.expiresAt && now > payload.expiresAt) {
      await fs.unlink(filePath).catch(() => {});
      return NextResponse.json({ error: "SHARE_EXPIRED" }, { status: 410 });
    }

    // Process download count and limits
    payload.downloadCount += 1;

    const limitReached = payload.downloadLimit > 0 && payload.downloadCount >= payload.downloadLimit;

    if (limitReached) {
      // Exceeded download limit, delete immediately from disk
      await fs.unlink(filePath).catch(() => {});
      console.log(`[SHARE_LIMIT] Purged file ${id}.json due to limit cap: ${payload.downloadLimit}`);
    } else {
      // Write back updated count
      await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
    }

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
