import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

if (!DATABASE_URL && !isBuildPhase) {
  console.warn(
    "[NEON_DB] DATABASE_URL is not set. Database operations will fail."
  );
}

/**
 * Returns a Neon SQL tagged-template function.
 * Each call uses the HTTP-based serverless driver (no persistent TCP connection).
 */
export function getSQL() {
  if (!DATABASE_URL) {
    throw new Error(
      "[NEON_DB] DATABASE_URL environment variable is not configured."
    );
  }
  return neon(DATABASE_URL);
}

let _initialized = false;

/**
 * Auto-creates all required tables on first call.
 * Safe to call multiple times — uses IF NOT EXISTS.
 */
export async function ensureSchema() {
  if (_initialized) return;

  const sql = getSQL();

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      identifier TEXT UNIQUE NOT NULL,
      display_name TEXT,
      role TEXT NOT NULL DEFAULT 'guest',
      credits INTEGER NOT NULL DEFAULT 3,
      total_docs_processed INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      tax DECIMAL(10,2) NOT NULL DEFAULT 0,
      total DECIMAL(10,2) NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('CREDIT','DEBIT')),
      description TEXT,
      external_ref TEXT,
      previous_hash TEXT,
      hash TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS work_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT,
      document_type TEXT NOT NULL DEFAULT 'photo',
      preset_used TEXT,
      original_filename TEXT,
      output_size_kb REAL,
      output_width INTEGER,
      output_height INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      review_text TEXT,
      display_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      ciphertext TEXT NOT NULL,
      iv TEXT NOT NULL,
      metadata TEXT,
      expires_at BIGINT,
      download_limit INTEGER NOT NULL DEFAULT 1,
      download_count INTEGER NOT NULL DEFAULT 0,
      user_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  try {
    await sql`ALTER TABLE shares ADD COLUMN IF NOT EXISTS user_id TEXT`;
  } catch (err) {
    console.warn("[NEON_DB] ALTER TABLE shares user_id column warning (may already exist):", err);
  }


  await sql`
    CREATE TABLE IF NOT EXISTS processed_images (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      filename TEXT,
      is_paid BOOLEAN NOT NULL DEFAULT FALSE,
      size_kb REAL,
      width INTEGER,
      height INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS otps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      identifier TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rate_limits (
      id SERIAL PRIMARY KEY,
      rate_key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  _initialized = true;
  console.log("[NEON_DB] Schema initialized — all 8 tables verified.");
}

