/**
 * Client-side AES-GCM Zero-Knowledge Encryption Utilities
 */

// Helper: Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const len = bytes.byteLength;
  const chunk = 8192;
  for (let i = 0; i < len; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as unknown as number[]
    );
  }
  return window.btoa(binary);
}


// Helper: Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper: Derive CryptoKey from password using PBKDF2
async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export interface EncryptedShareResult {
  ciphertext: string;
  iv: string;
  metadata: string;
  shareKey?: string; // only if no password
}

/**
 * Encrypts a file client-side.
 * If password is provided, derives key via PBKDF2.
 * Otherwise, generates a random key.
 */
export async function encryptFile(file: File, password?: string): Promise<EncryptedShareResult> {
  const fileBytes = await file.arrayBuffer();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12-byte IV for AES-GCM

  let key: CryptoKey;
  let shareKey: string | undefined;
  let saltBase64 = "";

  if (password) {
    // Derive key using password and random salt
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    saltBase64 = arrayBufferToBase64(salt.buffer);
    key = await deriveKeyFromPassword(password, salt);
  } else {
    // Generate a random raw key
    key = await window.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true, // exportable
      ["encrypt", "decrypt"]
    );
    const rawKey = await window.crypto.subtle.exportKey("raw", key);
    // Base64URL encoding to safely embed in URL hash
    shareKey = arrayBufferToBase64(rawKey)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  // Encrypt file content
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    fileBytes
  );

  // Plaintext metadata structure
  const metaObj = {
    name: file.name,
    type: file.type,
    size: file.size,
    hasPassword: !!password,
    salt: saltBase64,
  };

  return {
    ciphertext: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv.buffer),
    metadata: JSON.stringify(metaObj),
    shareKey,
  };
}

/**
 * Decrypts a ciphertext using either a shareKey (from URL hash) or derived key from password.
 */
export async function decryptFile(
  ciphertextBase64: string,
  ivBase64: string,
  metadataStr: string,
  keyOrPassword?: string
): Promise<{ file: File; url: string }> {
  const metaObj = JSON.parse(metadataStr);
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
  const encryptedBytes = base64ToArrayBuffer(ciphertextBase64);

  let key: CryptoKey;

  if (metaObj.hasPassword) {
    if (!keyOrPassword) {
      throw new Error("PASSWORD_REQUIRED");
    }
    const salt = new Uint8Array(base64ToArrayBuffer(metaObj.salt));
    key = await deriveKeyFromPassword(keyOrPassword, salt);
  } else {
    if (!keyOrPassword) {
      throw new Error("DECRYPTION_KEY_MISSING");
    }
    // Reconstruct raw key bytes from base64url
    let base64 = keyOrPassword.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const rawKeyBytes = base64ToArrayBuffer(base64);
    key = await window.crypto.subtle.importKey(
      "raw",
      rawKeyBytes,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
  }

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encryptedBytes
    );

    const blob = new Blob([decryptedBuffer], { type: metaObj.type || "application/octet-stream" });
    const file = new File([blob], metaObj.name || "decrypted_file", { type: metaObj.type });
    const url = URL.createObjectURL(blob);

    return { file, url };
  } catch (err) {
    console.error("[DECRYPTION_FAILED]", err);
    throw new Error("DECRYPTION_FAILED");
  }
}
