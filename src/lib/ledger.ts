import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface LedgerEntry {
  id: string;
  timestamp: string;
  userId: string;
  amount: number;       // Base cost
  tax: number;          // GST 18%
  total: number;        // Final billed total
  type: "CREDIT" | "DEBIT";
  description: string;
  externalRef: string;  // Razorpay payment ID
  previousHash: string;
  hash: string;
}

const LEDGER_PATH = path.join(process.cwd(), "data", "ledger.jsonl");

/**
 * Reads the last entry from the ledger to fetch its hash
 */
export function getLastLedgerEntry(): LedgerEntry | null {
  try {
    if (!fs.existsSync(LEDGER_PATH)) {
      return null;
    }
    const data = fs.readFileSync(LEDGER_PATH, "utf-8").trim().split("\n");
    if (data.length === 0 || !data[0]) return null;
    
    const lastLine = data[data.length - 1];
    return JSON.parse(lastLine) as LedgerEntry;
  } catch (err) {
    console.error("[LEDGER_READ_ERROR]", err);
    return null;
  }
}

/**
 * Appends a new transaction entry into the ledger with a cryptographic linked hash
 */
export function logTransactionLedger(
  userId: string,
  amount: number,
  type: "CREDIT" | "DEBIT",
  description: string,
  externalRef: string
): LedgerEntry {
  const dir = path.dirname(LEDGER_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const lastEntry = getLastLedgerEntry();
  const previousHash = lastEntry ? lastEntry.hash : "0000000000000000000000000000000000000000000000000000000000000000";

  const tax = Math.round(amount * 0.18 * 100) / 100;
  const total = Math.round((amount + tax) * 100) / 100;

  const entryDataWithoutHash = {
    id: `tx_${crypto.randomBytes(8).toString("hex")}`,
    timestamp: new Date().toISOString(),
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

  const entry: LedgerEntry = {
    ...entryDataWithoutHash,
    hash,
  };

  fs.appendFileSync(LEDGER_PATH, JSON.stringify(entry) + "\n", "utf-8");
  console.log(`[LEDGER INTEGRITY AUDIT] Recorded transaction ${entry.id} with hash ${hash.substring(0, 16)}...`);
  
  return entry;
}

/**
 * Retrieves the entire list of transactions
 */
export function getLedgerHistory(): LedgerEntry[] {
  try {
    if (!fs.existsSync(LEDGER_PATH)) {
      return [];
    }
    const data = fs.readFileSync(LEDGER_PATH, "utf-8").trim().split("\n");
    return data.filter(line => line.trim() !== "").map(line => JSON.parse(line) as LedgerEntry);
  } catch {
    return [];
  }
}
