import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const SHARES_DIR = path.join(process.cwd(), "data", "shares");

// Helper to ensure shares directory exists
async function ensureSharesDir() {
  try {
    await fs.mkdir(SHARES_DIR, { recursive: true });
  } catch (err) {
    // Ignore if already exists
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ciphertext, iv, metadata, expirationMinutes, downloadLimit } = body;

    if (!ciphertext || !iv || !metadata) {
      return NextResponse.json(
        { error: "MISSING_ENCRYPTED_PAYLOAD" },
        { status: 400 }
      );
    }

    await ensureSharesDir();

    // Generate a unique ID (secure random alphanumeric)
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Calculate expiration time
    const minutes = parseInt(expirationMinutes) || 60; // default to 60 minutes
    const expiresAt = Date.now() + minutes * 60 * 1000;

    const payload = {
      id,
      ciphertext,
      iv,
      metadata,
      expiresAt,
      downloadLimit: parseInt(downloadLimit) || 0, // 0 means unlimited
      downloadCount: 0,
    };

    const filePath = path.join(SHARES_DIR, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");

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

async function passiveCleanup() {
  try {
    const files = await fs.readdir(SHARES_DIR);
    const now = Date.now();
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const filePath = path.join(SHARES_DIR, file);
      try {
        const data = await fs.readFile(filePath, "utf8");
        const parsed = JSON.parse(data);
        if (parsed.expiresAt && now > parsed.expiresAt) {
          await fs.unlink(filePath);
          console.log(`[SHARE_CLEANUP] Deleted expired share file: ${file}`);
        }
      } catch (e) {
        // Corrupt file, delete it
        await fs.unlink(filePath).catch(() => {});
      }
    }
  } catch (err) {
    console.error("Passive cleanup failed:", err);
  }
}
