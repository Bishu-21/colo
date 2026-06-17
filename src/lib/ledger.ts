import crypto from "crypto";
import { getSQL, ensureSchema } from "@/utils/neonDb";

export interface LedgerEntry {
  id: string;
  timestamp: string;
  userId: string;
  amount: number;
  tax: number;
  total: number;
  type: "CREDIT" | "DEBIT";
  description: string;
  externalRef: string;
  previousHash: string;
  hash: string;
}

// Sequential write queue to prevent race conditions in cryptographic link calculations
class AsyncWriteQueue {
  private queue: Promise<any> = Promise.resolve();

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = this.queue.then(task);
    this.queue = result.catch(() => {}); // Catch and continue to prevent halting queue
    return result;
  }
}

const writeQueue = new AsyncWriteQueue();

// Memory cache for the last entry's hash (warm on first write)
let cachedLastHash: string | null = null;

/**
 * Reads the last entry from the ledger to fetch its hash
 */
export async function getLastLedgerEntry(): Promise<LedgerEntry | null> {
  await ensureSchema();
  const sql = getSQL();
  const rows = await sql`SELECT * FROM transactions ORDER BY created_at DESC LIMIT 1`;
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    timestamp: new Date(row.created_at).toISOString(),
    userId: row.user_id,
    amount: parseFloat(row.amount),
    tax: parseFloat(row.tax),
    total: parseFloat(row.total),
    type: row.type as "CREDIT" | "DEBIT",
    description: row.description,
    externalRef: row.external_ref,
    previousHash: row.previous_hash,
    hash: row.hash,
  };
}

/**
 * Appends a new transaction entry into the ledger with a cryptographic linked hash.
 * Uses an asynchronous sequential queue to guarantee hash chain integrity under concurrency.
 */
export async function logTransactionLedger(
  userId: string,
  amount: number,
  type: "CREDIT" | "DEBIT",
  description: string,
  externalRef: string
): Promise<LedgerEntry> {
  return writeQueue.enqueue(async () => {
    await ensureSchema();
    const sql = getSQL();

    // Get the previous hash from cache or database
    let previousHash = cachedLastHash;
    if (!previousHash) {
      const lastEntry = await getLastLedgerEntry();
      previousHash = lastEntry
        ? lastEntry.hash
        : "0000000000000000000000000000000000000000000000000000000000000000";
    }

    const tax = Math.round(amount * 0.18 * 100) / 100;
    const total = Math.round((amount + tax) * 100) / 100;

    const entryId = `tx_${crypto.randomBytes(8).toString("hex")}`;
    const timestamp = new Date().toISOString();

    const entryDataWithoutHash = {
      id: entryId,
      timestamp,
      userId,
      amount,
      tax,
      total,
      type,
      description,
      externalRef,
      previousHash,
    };

    // Compute cryptographic SHA256 integrity hash linking the current block to the previous entry
    const hash = crypto
      .createHmac("sha256", "ledger_salt_key_delta_alpha")
      .update(previousHash + JSON.stringify(entryDataWithoutHash))
      .digest("hex");

    // Insert into Neon database
    await sql`
      INSERT INTO transactions (id, user_id, amount, tax, total, type, description, external_ref, previous_hash, hash)
      VALUES (${entryId}, ${userId}, ${amount}, ${tax}, ${total}, ${type}, ${description}, ${externalRef}, ${previousHash}, ${hash})
    `;

    // Update memory cache for next sequential transaction
    cachedLastHash = hash;

    const entry: LedgerEntry = {
      ...entryDataWithoutHash,
      hash,
    };

    console.log(
      `[LEDGER INTEGRITY AUDIT] Recorded transaction ${entry.id} with hash ${hash.substring(0, 16)}...`
    );
    return entry;
  });
}

/**
 * Retrieves the entire list of transactions
 */
export async function getLedgerHistory(): Promise<LedgerEntry[]> {
  try {
    await ensureSchema();
    const sql = getSQL();
    const rows = await sql`SELECT * FROM transactions ORDER BY created_at ASC`;
    return rows.map((row) => ({
      id: row.id,
      timestamp: new Date(row.created_at).toISOString(),
      userId: row.user_id,
      amount: parseFloat(row.amount),
      tax: parseFloat(row.tax),
      total: parseFloat(row.total),
      type: row.type as "CREDIT" | "DEBIT",
      description: row.description,
      externalRef: row.external_ref,
      previousHash: row.previous_hash,
      hash: row.hash,
    }));
  } catch (err) {
    console.error("[LEDGER_HISTORY_ERROR]", err);
    return [];
  }
}
