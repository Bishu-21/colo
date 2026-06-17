import fs from "fs";
import path from "path";
import { getSQL, ensureSchema } from "./neonDb";

// Binary file storage stays on disk (ephemeral in serverless /tmp)
const isServerless = !!(
  process.env.VERCEL ||
  process.env.NOW_BUILDER ||
  process.env.AWS_LAMBDA_FUNCTION_NAME
);
const FILE_DIR = isServerless ? "/tmp" : path.join(process.cwd(), "data");
const PROCESSED_DIR = path.join(FILE_DIR, "processed");

// ─── Type Definitions ─────────────────────────────────────────────

export interface DbUser {
  identifier: string;
  credits: number;
  role: string;
  total_docs_processed?: number;
  display_name?: string;
}

export interface DbShare {
  id: string;
  ciphertext: string;
  iv: string;
  metadata: string;
  expiresAt: number;
  downloadLimit: number;
  downloadCount: number;
  userId?: string;
}


export interface DbProcessedImage {
  id: string;
  userId: string;
  filename: string;
  isPaid: boolean;
  createdAt: number;
  sizeKb: number;
  width: number;
  height: number;
}

// ─── User Actions ─────────────────────────────────────────────────

export async function getUser(identifier: string): Promise<DbUser | null> {
  await ensureSchema();
  const sql = getSQL();
  const cleanId = identifier.trim().toLowerCase();
  const rows = await sql`SELECT * FROM users WHERE identifier = ${cleanId} LIMIT 1`;
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    identifier: row.identifier,
    credits: row.credits,
    role: row.role,
    total_docs_processed: row.total_docs_processed,
    display_name: row.display_name,
  };
}

export async function saveUser(user: DbUser): Promise<DbUser> {
  await ensureSchema();
  const sql = getSQL();
  const cleanId = user.identifier.trim().toLowerCase();

  const rows = await sql`
    INSERT INTO users (identifier, role, credits, display_name, updated_at)
    VALUES (${cleanId}, ${user.role}, ${user.credits}, ${user.display_name || null}, NOW())
    ON CONFLICT (identifier) DO UPDATE SET
      role = ${user.role},
      credits = ${user.credits},
      display_name = COALESCE(${user.display_name || null}, users.display_name),
      updated_at = NOW()
    RETURNING *
  `;

  const row = rows[0];
  return {
    identifier: row.identifier,
    credits: row.credits,
    role: row.role,
    total_docs_processed: row.total_docs_processed,
    display_name: row.display_name,
  };
}

export async function updateLastLogin(identifier: string): Promise<void> {
  await ensureSchema();
  const sql = getSQL();
  const cleanId = identifier.trim().toLowerCase();
  await sql`UPDATE users SET last_login_at = NOW() WHERE identifier = ${cleanId}`;
}

export async function incrementDocsProcessed(identifier: string): Promise<void> {
  await ensureSchema();
  const sql = getSQL();
  const cleanId = identifier.trim().toLowerCase();
  await sql`UPDATE users SET total_docs_processed = total_docs_processed + 1, updated_at = NOW() WHERE identifier = ${cleanId}`;
}

export async function deductUserCredit(identifier: string): Promise<number> {
  await ensureSchema();
  const sql = getSQL();
  const cleanId = identifier.trim().toLowerCase();

  const rows = await sql`
    UPDATE users
    SET credits = credits - 1, updated_at = NOW()
    WHERE identifier = ${cleanId} AND credits >= 1
    RETURNING credits
  `;

  if (rows.length === 0) {
    throw new Error("INSUFFICIENT_CREDITS_OR_USER_NOT_FOUND");
  }

  return rows[0].credits;
}

// ─── Share Actions ────────────────────────────────────────────────

export async function getShare(id: string): Promise<DbShare | null> {
  await ensureSchema();
  const sql = getSQL();
  const rows = await sql`SELECT * FROM shares WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    ciphertext: row.ciphertext,
    iv: row.iv,
    metadata: row.metadata,
    expiresAt: Number(row.expires_at),
    downloadLimit: row.download_limit,
    downloadCount: row.download_count,
    userId: row.user_id || undefined,
  };
}

export async function saveShare(share: DbShare): Promise<void> {
  await ensureSchema();
  const sql = getSQL();
  await sql`
    INSERT INTO shares (id, ciphertext, iv, metadata, expires_at, download_limit, download_count, user_id)
    VALUES (${share.id}, ${share.ciphertext}, ${share.iv}, ${share.metadata}, ${share.expiresAt}, ${share.downloadLimit}, ${share.downloadCount}, ${share.userId || null})
    ON CONFLICT (id) DO UPDATE SET
      download_count = ${share.downloadCount},
      download_limit = ${share.downloadLimit},
      user_id = COALESCE(shares.user_id, EXCLUDED.user_id)
  `;
}

export async function deleteShare(id: string): Promise<void> {
  await ensureSchema();
  const sql = getSQL();
  await sql`DELETE FROM shares WHERE id = ${id}`;
}

export async function getAllShares(): Promise<DbShare[]> {
  await ensureSchema();
  const sql = getSQL();
  const rows = await sql`SELECT * FROM shares`;
  return rows.map((row) => ({
    id: row.id,
    ciphertext: row.ciphertext,
    iv: row.iv,
    metadata: row.metadata,
    expiresAt: Number(row.expires_at),
    downloadLimit: row.download_limit,
    downloadCount: row.download_count,
    userId: row.user_id || undefined,
  }));
}

// ─── Processed Image Actions ──────────────────────────────────────

export async function getProcessedImage(id: string): Promise<DbProcessedImage | null> {
  await ensureSchema();
  const sql = getSQL();
  const rows = await sql`SELECT * FROM processed_images WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    filename: row.filename,
    isPaid: row.is_paid,
    createdAt: new Date(row.created_at).getTime(),
    sizeKb: row.size_kb,
    width: row.width,
    height: row.height,
  };
}

export async function saveProcessedImage(img: DbProcessedImage): Promise<void> {
  await ensureSchema();
  const sql = getSQL();
  await sql`
    INSERT INTO processed_images (id, user_id, filename, is_paid, size_kb, width, height)
    VALUES (${img.id}, ${img.userId}, ${img.filename}, ${img.isPaid}, ${img.sizeKb}, ${img.width}, ${img.height})
    ON CONFLICT (id) DO UPDATE SET
      is_paid = ${img.isPaid},
      user_id = ${img.userId}
  `;
}

export async function deleteProcessedImage(id: string): Promise<void> {
  await ensureSchema();
  const sql = getSQL();
  await sql`DELETE FROM processed_images WHERE id = ${id}`;

  // Delete the physical files safely
  try {
    const cleanPath = getProcessedFilePath(id, "clean");
    if (fs.existsSync(cleanPath)) fs.unlinkSync(cleanPath);
    const wmPath = getProcessedFilePath(id, "wm");
    if (fs.existsSync(wmPath)) fs.unlinkSync(wmPath);
  } catch (err) {
    console.error(
      `[DB_FILE_DELETE_ERROR] Failed to delete image files for ${id}:`,
      err
    );
  }
}

export async function getAllProcessedImages(): Promise<DbProcessedImage[]> {
  await ensureSchema();
  const sql = getSQL();
  const rows = await sql`SELECT * FROM processed_images`;
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    filename: row.filename,
    isPaid: row.is_paid,
    createdAt: new Date(row.created_at).getTime(),
    sizeKb: row.size_kb,
    width: row.width,
    height: row.height,
  }));
}

// ─── Processed Image File Helpers (remain disk-based) ─────────────

function ensureProcessedDir() {
  try {
    if (!fs.existsSync(PROCESSED_DIR)) {
      fs.mkdirSync(PROCESSED_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("[PROCESSED_DIR_INIT_ERROR]", err);
  }
}

export function getProcessedFilePath(id: string, type: "clean" | "wm"): string {
  return path.join(PROCESSED_DIR, `${type}_${id}.jpg`);
}

export function saveProcessedFileData(
  id: string,
  type: "clean" | "wm",
  data: Buffer
): void {
  try {
    ensureProcessedDir();
    fs.writeFileSync(getProcessedFilePath(id, type), data);
  } catch (err) {
    console.error(
      `[DB_FILE_SAVE_ERROR] Failed to save ${type} file for ${id}:`,
      err
    );
  }
}

export function getProcessedFileData(
  id: string,
  type: "clean" | "wm"
): Buffer | null {
  try {
    const filePath = getProcessedFilePath(id, type);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
  } catch (err) {
    console.error(
      `[DB_FILE_READ_ERROR] Failed to read ${type} file for ${id}:`,
      err
    );
  }
  return null;
}

// ─── Work Log Actions ─────────────────────────────────────────────

export async function logWork(params: {
  userId: string;
  documentType: string;
  presetUsed?: string;
  originalFilename?: string;
  outputSizeKb?: number;
  outputWidth?: number;
  outputHeight?: number;
}): Promise<void> {
  await ensureSchema();
  const sql = getSQL();
  await sql`
    INSERT INTO work_logs (user_id, document_type, preset_used, original_filename, output_size_kb, output_width, output_height)
    VALUES (${params.userId}, ${params.documentType}, ${params.presetUsed || null}, ${params.originalFilename || null}, ${params.outputSizeKb || null}, ${params.outputWidth || null}, ${params.outputHeight || null})
  `;
}

export async function getUserWorkLogs(userId: string): Promise<any[]> {
  await ensureSchema();
  const sql = getSQL();
  const cleanId = userId.trim().toLowerCase();
  const rows = await sql`SELECT * FROM work_logs WHERE user_id = ${cleanId} ORDER BY created_at DESC LIMIT 100`;
  return rows;
}

// ─── Review Actions ───────────────────────────────────────────────

export async function addReview(params: {
  userId?: string;
  rating: number;
  reviewText?: string;
  displayName?: string;
}): Promise<void> {
  await ensureSchema();
  const sql = getSQL();
  await sql`
    INSERT INTO reviews (user_id, rating, review_text, display_name)
    VALUES (${params.userId || null}, ${params.rating}, ${params.reviewText || null}, ${params.displayName || null})
  `;
}

export async function getReviews(): Promise<any[]> {
  await ensureSchema();
  const sql = getSQL();
  const rows = await sql`SELECT * FROM reviews ORDER BY created_at DESC LIMIT 50`;
  return rows;
}

export async function getReviewStats(): Promise<{ count: number; avgRating: number }> {
  await ensureSchema();
  const sql = getSQL();
  const rows = await sql`SELECT COUNT(*)::int as count, COALESCE(AVG(rating), 0)::float as avg_rating FROM reviews`;
  return {
    count: rows[0]?.count || 0,
    avgRating: Math.round((rows[0]?.avg_rating || 0) * 10) / 10,
  };
}

// ─── Aggregate Stats ──────────────────────────────────────────────

export async function getAggregateStats(): Promise<{
  totalUsers: number;
  totalDocsProcessed: number;
  reviewCount: number;
  avgRating: number;
}> {
  await ensureSchema();
  const sql = getSQL();

  const userRows = await sql`SELECT COUNT(*)::int as count, COALESCE(SUM(total_docs_processed), 0)::int as total_docs FROM users`;
  const reviewRows = await sql`SELECT COUNT(*)::int as count, COALESCE(AVG(rating), 0)::float as avg_rating FROM reviews`;

  return {
    totalUsers: userRows[0]?.count || 0,
    totalDocsProcessed: userRows[0]?.total_docs || 0,
    reviewCount: reviewRows[0]?.count || 0,
    avgRating: Math.round((reviewRows[0]?.avg_rating || 0) * 10) / 10,
  };
}

export async function saveOtp(identifier: string, code: string, expiresAt: Date): Promise<void> {
  await ensureSchema();
  const sql = getSQL();
  const cleanId = identifier.trim().toLowerCase();

  // Clean up any old OTPs for this identifier first
  await sql`DELETE FROM otps WHERE identifier = ${cleanId}`;

  await sql`
    INSERT INTO otps (identifier, code, expires_at)
    VALUES (${cleanId}, ${code}, ${expiresAt})
  `;
}

export async function verifyOtp(identifier: string, code: string): Promise<boolean> {
  await ensureSchema();
  const sql = getSQL();
  const cleanId = identifier.trim().toLowerCase();

  const rows = await sql`
    SELECT * FROM otps
    WHERE identifier = ${cleanId} AND code = ${code} AND expires_at > NOW()
    LIMIT 1
  `;

  if (rows.length === 0) return false;

  // Consume (delete) the OTP after successful validation to prevent reuse
  await sql`DELETE FROM otps WHERE identifier = ${cleanId}`;
  return true;
}

export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  await ensureSchema();
  const sql = getSQL();
  const cleanKey = key.trim();

  // Delete records older than the window
  const cutoff = new Date(Date.now() - windowSeconds * 1000);
  await sql`DELETE FROM rate_limits WHERE rate_key = ${cleanKey} AND created_at < ${cutoff}`;

  // Count active attempts
  const rows = await sql`SELECT COUNT(*)::int as count FROM rate_limits WHERE rate_key = ${cleanKey}`;
  const count = rows[0]?.count || 0;

  if (count >= limit) {
    return true; // Rate limited
  }

  // Record new attempt
  await sql`INSERT INTO rate_limits (rate_key) VALUES (${cleanKey})`;
  return false;
}

