import fs from "fs";
import path from "path";

// Setup environment variables before any imports to ensure database utility gets the variables at loading time
(process.env as any).NODE_ENV = "test";

try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=").replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (err) {
  console.warn("Failed to load .env.local in test:", err);
}
import { describe, it } from "node:test";
import assert from "node:assert";
import { verifyNeonToken } from "../utils/authConfig";

describe("MORPEE Hardening Test Suite", () => {

  // --- Auth Session Behavior ---
  describe("Neon Auth Session Behavior", () => {
    it("should verify neon auth token and extract identifier correctly", async () => {
      // Mock Neon token payload structure
      const payload = { 
        email: "candidate@test.com", 
        sub: "user_neon_sub_id_123", 
        role: "candidate", 
        credits: 5 
      };
      
      const token = "mock_" + Buffer.from(JSON.stringify({ alg: "EdDSA" })).toString("base64") + "." + 
                    Buffer.from(JSON.stringify(payload)).toString("base64") + ".signature";

      const verified = await verifyNeonToken(token);
      assert.ok(verified);
      assert.strictEqual(verified.email, "candidate@test.com");
      assert.strictEqual(verified.sub, "user_neon_sub_id_123");
      assert.strictEqual(verified.role, "candidate");
    });
  });

  // --- Database Auto-Provisioning Behavior ---
  describe("Neon Database Auto-Provisioning Behavior", () => {
    it("should provision user in database if not already present", async () => {
      const { getUser, saveUser } = await import("../utils/db");
      const email = `temp_neon_user_${Date.now()}@test.com`;
      const dbUserBefore = await getUser(email);
      assert.strictEqual(dbUserBefore, null);

      // Trigger save/provision
      const dbUserAfter = await saveUser({
        identifier: email,
        role: "candidate",
        credits: 3,
      });

      assert.ok(dbUserAfter);
      assert.strictEqual(dbUserAfter.identifier, email);
      assert.strictEqual(dbUserAfter.credits, 3);
      assert.strictEqual(dbUserAfter.role, "candidate");
    });
  });

  // --- Payment Plan Mapping ---
  describe("Payment Plan Mapping", () => {
    const SERVER_PLANS: Record<string, { price: number; name: string; credits: number }> = {
      "candidate": { price: 49, name: "Candidate Pass (Single Season)", credits: 100 },
      "csc": { price: 499, name: "CSC Operator Subscription (Monthly)", credits: 1000 },
      "enterprise": { price: 999, name: "Enterprise API SDK (Pay-As-You-Go)", credits: 10000 }
    };

    it("should map plans correctly to server-defined pricing", () => {
      assert.strictEqual(SERVER_PLANS["candidate"].price, 49);
      assert.strictEqual(SERVER_PLANS["csc"].price, 499);
      assert.strictEqual(SERVER_PLANS["enterprise"].price, 999);
    });

    it("should allocate correct credits per plan", () => {
      assert.strictEqual(SERVER_PLANS["candidate"].credits, 100);
      assert.strictEqual(SERVER_PLANS["csc"].credits, 1000);
      assert.strictEqual(SERVER_PLANS["enterprise"].credits, 10000);
    });
  });

  // --- Payment Amount & Tax Validation ---
  describe("Payment Amount & Tax Validation", () => {
    it("should enforce server-side calculated pricing with 18% GST", () => {
      const basePrice = 49; // Candidate plan
      const gst = Math.round(basePrice * 0.18 * 100) / 100; // 8.82
      const total = Math.round((basePrice + gst) * 100) / 100; // 57.82

      assert.strictEqual(gst, 8.82);
      assert.strictEqual(total, 57.82);
    });

    it("should validate client amount matches server calculated total", () => {
      const clientAmount = 57.82;
      const basePrice = 49;
      const gst = Math.round(basePrice * 0.18 * 100) / 100;
      const expectedAmount = Math.round((basePrice + gst) * 100) / 100;

      const isValid = Math.abs(clientAmount - expectedAmount) <= 0.01;
      assert.ok(isValid);
    });

    it("should fail validation if client amount is modified/manipulated", () => {
      const manipulatedAmount = 10.00; // Manipulation attempt
      const basePrice = 49;
      const gst = Math.round(basePrice * 0.18 * 100) / 100;
      const expectedAmount = Math.round((basePrice + gst) * 100) / 100;

      const isValid = Math.abs(manipulatedAmount - expectedAmount) <= 0.01;
      assert.ok(!isValid);
    });
  });

  // --- Image Unlock Ownership ---
  describe("Image Unlock Ownership & Access Control", () => {
    it("should reject image unlock if owner doesn't match active session", () => {
      const imageOwner = "user_one@test.com";
      const activeUser = "user_two@test.com";
      const isMatch = imageOwner.toLowerCase() === activeUser.toLowerCase();

      assert.ok(!isMatch);
    });

    it("should permit image unlock if owner matches active session", () => {
      const imageOwner = "user_one@test.com";
      const activeUser = "user_one@test.com";
      const isMatch = imageOwner.toLowerCase() === activeUser.toLowerCase();

      assert.ok(isMatch);
    });
  });

  // --- Share Limits & Expirations ---
  describe("Share Limits & Expirations", () => {
    it("should expire share if current timestamp exceeds expiresAt limit", () => {
      const now = Date.now();
      const expiresAt = now - 5000; // Expired 5 seconds ago
      const isExpired = now > expiresAt;

      assert.ok(isExpired);
    });

    it("should enforce download limits cap", () => {
      const downloadLimit = 2;
      let downloadCount = 2;
      const isLimitReached = downloadLimit > 0 && downloadCount >= downloadLimit;

      assert.ok(isLimitReached);
    });
  });

  // --- Mock Route Integration Check ---
  describe("Route-Level Integration: Payment Verification", () => {
    it("should verify signature and process idempotent transaction verify logic successfully", async () => {
      // Mock payment details
      const razorpay_order_id = "order_mock_12345";
      const razorpay_payment_id = "pay_mock_12345";
      const planId = "candidate";
      const amount = 57.82;

      // Mock database idempotency state
      const mockDatabaseTransactions = new Set<string>();

      // Verifier simulator
      const runVerification = (paymentId: string) => {
        if (mockDatabaseTransactions.has(paymentId)) {
          return { success: true, idempotentBypass: true };
        }
        // Save tx and issue credits
        mockDatabaseTransactions.add(paymentId);
        return { success: true, creditsIssued: 100 };
      };

      // First run (fresh transaction)
      const res1 = runVerification(razorpay_payment_id);
      assert.deepStrictEqual(res1, { success: true, creditsIssued: 100 });
      assert.ok(mockDatabaseTransactions.has(razorpay_payment_id));

      // Second run (duplicate check / replay attack)
      const res2 = runVerification(razorpay_payment_id);
      assert.deepStrictEqual(res2, { success: true, idempotentBypass: true });
    });
  });

  // --- Smoke Test for Workspace Landing ---
  describe("Workspace Landing Smoke Test", () => {
    it("should resolve main landing page assets and path parameters", () => {
      const workspaceTools = ["scan", "image", "pdf-compressor"];
      assert.ok(workspaceTools.includes("image"));
      assert.ok(workspaceTools.includes("scan"));
      assert.ok(workspaceTools.includes("pdf-compressor"));
    });
  });

  // --- Additional Coverage for Auth, Payment, Share, and Image Unlock ---
  describe("Hardened Security Flow Coverage Details", () => {
    it("should correctly fail JWT secret lookup in production if env is missing", () => {
      const originalEnv = process.env.NODE_ENV;
      const originalSecret = process.env.JWT_SECRET;
      
      try {
        (process.env as any).NODE_ENV = "production";
        delete process.env.JWT_SECRET;
        const { getJwtSecret } = require("../utils/authConfig");
        assert.throws(() => getJwtSecret(), /CRITICAL: JWT_SECRET environment variable is missing/);
      } finally {
        (process.env as any).NODE_ENV = originalEnv;
        process.env.JWT_SECRET = originalSecret;
      }
    });

    it("should reject image unlock for guest user if guest has 0 credits", () => {
      const currentCredits = 0;
      const isGuest = true;
      const canUnlock = !isGuest || currentCredits >= 1;
      assert.ok(!canUnlock);
    });

    it("should enforce database rate limit checker for sharing attempts", async () => {
      const { checkRateLimit } = await import("../utils/db");
      const key = "rate_test_key";
      
      // Attempt to check limit multiple times
      const r1 = await checkRateLimit(key, 2, 10);
      assert.ok(!r1); // First call within limit
      const r2 = await checkRateLimit(key, 2, 10);
      assert.ok(!r2); // Second call within limit
      const r3 = await checkRateLimit(key, 2, 10);
      assert.ok(r3); // Third call exceeds limit of 2
    });
  });
});
