import { getAllShares, deleteShare } from "./db";

export async function passiveCleanup() {
  try {
    const shares = await getAllShares();
    const now = Date.now();
    for (const share of shares) {
      if (share.expiresAt && now > share.expiresAt) {
        await deleteShare(share.id);
        console.log(`[SHARE_CLEANUP] Deleted expired share: ${share.id}`);
      }
    }
  } catch (err) {
    console.error("Passive cleanup failed:", err);
  }
}
