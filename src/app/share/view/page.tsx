"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { decryptFile } from "@/utils/cryptoSharing";

function ShareViewPageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [payload, setPayload] = useState<any>(null);

  const [password, setPassword] = useState("");
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedFile, setDecryptedFile] = useState<File | null>(null);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);

  // Read share key from URL hash
  const getShareKey = () => {
    if (typeof window === "undefined") return "";
    const hash = window.location.hash || "";
    if (hash.startsWith("#key=")) {
      return hash.substring(5);
    }
    return "";
  };

  useEffect(() => {
    if (!id) {
      setError("INVALID_SHARE_LINK");
      setLoading(false);
      return;
    }

    async function fetchSharePayload() {
      try {
        const res = await fetch(`/api/share/${id}`);
        if (!res.ok) {
          if (res.status === 410) {
            throw new Error("SHARE_EXPIRED_OR_DELETED");
          }
          if (res.status === 404) {
            throw new Error("SHARE_NOT_FOUND");
          }
          throw new Error("FETCH_FAILED");
        }

        const data = await res.json();
        setPayload(data);
        const meta = JSON.parse(data.metadata);
        setMetadata(meta);

        // If no password is required, try to decrypt immediately using the key from hash
        if (!meta.hasPassword) {
          const key = getShareKey();
          if (key) {
            const decrypted = await decryptFile(data.ciphertext, data.iv, data.metadata, key);
            setDecryptedFile(decrypted.file);
            setDecryptedUrl(decrypted.url);
            fetch(`/api/share/${id}`, { method: "POST" }).catch(e => console.error(e));
          } else {
            throw new Error("DECRYPTION_KEY_MISSING");
          }
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "UNKNOWN_ERROR");
      } finally {
        setLoading(false);
      }
    }

    fetchSharePayload();
  }, [id]);

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payload || !metadata) return;

    setDecrypting(true);
    setError(null);

    try {
      let decrypted;
      if (metadata.hasPassword) {
        decrypted = await decryptFile(payload.ciphertext, payload.iv, payload.metadata, password);
      } else {
        const key = getShareKey();
        decrypted = await decryptFile(payload.ciphertext, payload.iv, payload.metadata, key);
      }

      setDecryptedFile(decrypted.file);
      setDecryptedUrl(decrypted.url);
      fetch(`/api/share/${id}`, { method: "POST" }).catch(e => console.error(e));
    } catch (err: any) {
      console.error(err);
      if (err.message === "DECRYPTION_FAILED") {
        setError("INCORRECT_PASSWORD");
      } else {
        setError("DECRYPTION_ERROR");
      }
    } finally {
      setDecrypting(false);
    }
  };

  const getReadableSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between select-none">
      {/* Header */}
      <header className="bg-background border-b border-on-surface flex justify-between items-center w-full px-container-padding h-16 fixed top-0 z-50">
        <div className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-widest uppercase">
          <Link href="/">morpee</Link>
        </div>
        <div className="font-metadata text-metadata text-primary font-bold">
          [SECURE_SHARE_ROUTER]
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow pt-24 pb-16 flex items-center justify-center px-4">
        <div className="w-full max-w-lg double-border shadow-2xl">
          <div className="double-border-inner space-y-6">
            <div className="text-center">
              <span className="material-symbols-outlined text-5xl text-primary mb-2">
                vpn_key
              </span>
              <h1 className="font-headline-sm text-headline-sm uppercase text-carbon tracking-wider">
                Crypto Decryption Node
              </h1>
              <p className="font-metadata text-[10px] text-secondary mt-1 uppercase">
                Zero-Knowledge Client-Side Decryption Engine
              </p>
            </div>

            <hr className="border-carbon/15" />

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="font-metadata text-metadata text-secondary uppercase animate-pulse">
                  Connecting to encrypted store...
                </p>
              </div>
            ) : error === "SHARE_EXPIRED_OR_DELETED" || error === "SHARE_NOT_FOUND" ? (
              <div className="text-center py-8 space-y-4">
                <span className="material-symbols-outlined text-error text-5xl">
                  running_with_errors
                </span>
                <h2 className="font-label-bold text-label-bold text-error uppercase">
                  Secure Link Expired or Purged
                </h2>
                <p className="font-body-md text-xs text-secondary leading-relaxed">
                  This shared document has exceeded its session lifetime or its single-download token cap. The file has been permanently deleted from MORPEE servers.
                </p>
                <div className="pt-4">
                  <Link href="/workspace" className="px-6 py-2.5 bg-carbon text-surface font-metadata text-metadata uppercase hover:bg-muted-teal transition-all rounded-full inline-block">
                    [Go to Workspace]
                  </Link>
                </div>
              </div>
            ) : error === "DECRYPTION_KEY_MISSING" && !metadata?.hasPassword ? (
              <div className="text-center py-8 space-y-4">
                <span className="material-symbols-outlined text-error text-5xl">
                  lock_open
                </span>
                <h2 className="font-label-bold text-label-bold text-error uppercase">
                  Decryption Key Missing
                </h2>
                <p className="font-body-md text-xs text-secondary leading-relaxed">
                  The zero-knowledge decryption key is missing from the URL hash. Make sure you copied the entire link, including the key hash at the end.
                </p>
              </div>
            ) : decryptedFile ? (
              // Success Screen
              <div className="space-y-6">
                <div className="bg-primary/5 border border-primary/20 p-4 rounded text-center">
                  <span className="material-symbols-outlined text-primary text-5xl mb-2">
                    lock_open
                  </span>
                  <h2 className="font-label-bold text-label-bold text-primary uppercase">
                    Decrypted Successfully
                  </h2>
                  <p className="font-metadata text-[10px] text-secondary mt-1">
                    Processed safely in local browser memory
                  </p>
                </div>

                <div className="bg-surface-container-low border border-carbon/15 p-4 font-metadata text-xs space-y-2 uppercase">
                  <div className="flex justify-between border-b border-carbon/10 pb-1.5">
                    <span className="text-secondary">File Name</span>
                    <span className="font-bold text-carbon max-w-[200px] truncate">
                      {decryptedFile.name}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-carbon/10 pb-1.5">
                    <span className="text-secondary">File Size</span>
                    <span className="font-bold text-carbon">
                      {getReadableSize(decryptedFile.size)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">File Type</span>
                    <span className="font-bold text-carbon">
                      {decryptedFile.type || "BINARY"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                   <a
                    href={decryptedUrl || "#"}
                    download={decryptedFile.name}
                    className="w-full py-4 bg-primary text-white font-label-bold text-label-bold uppercase rounded-full hover:bg-carbon transition-colors flex items-center justify-center gap-2 select-none"
                  >
                    Download File
                    <span className="material-symbols-outlined text-[18px]">download</span>
                  </a>
                  <Link href="/workspace" className="w-full text-center py-3 border border-carbon rounded-full font-label-bold text-xs uppercase hover:bg-surface-container-high transition-colors inline-block">
                    [Go to Workspace]
                  </Link>
                </div>
              </div>
            ) : (
              // Decryption Form (Password prompt or Decrypt trigger)
              <form onSubmit={handleDecrypt} className="space-y-6">
                {metadata?.hasPassword ? (
                  <div className="space-y-2">
                    <label className="font-metadata text-[10px] uppercase text-secondary block">
                      Enter Password to Decrypt File
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full p-3 bg-white border border-carbon font-metadata focus:outline-none focus:border-primary text-center"
                    />
                    {error === "INCORRECT_PASSWORD" && (
                      <p className="text-error font-metadata text-[10px] text-center uppercase mt-1">
                        ✗ INCORRECT_PASSWORD // PLEASE_RETRY
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-surface-container p-4 rounded text-center">
                    <span className="material-symbols-outlined text-secondary text-4xl mb-2">
                      enhanced_encryption
                    </span>
                    <p className="font-body-md text-xs text-secondary leading-relaxed">
                      This file is encrypted with a unique zero-knowledge hash. Ready to run client-side decryption.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={decrypting}
                  className="w-full py-4 bg-carbon text-surface font-label-bold text-label-bold uppercase rounded-full hover:bg-muted-teal transition-all flex items-center justify-center gap-2"
                >
                  <span>{decrypting ? "Decrypting..." : "Decrypt & Download"}</span>
                  <span className={`material-symbols-outlined ${decrypting ? "animate-spin" : ""}`}>
                    key
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-carbon text-surface-bright font-metadata text-[10px] uppercase flex justify-between px-container-padding items-center h-10 border-t border-outline">
        <span className="text-primary font-bold">MORPEE ZERO-KNOWLEDGE PROTOCOL v2</span>
        <span className="text-surface-variant/60">FILES ARE DECRYPTED LOCALLY IN CLIENT RAM</span>
      </footer>
    </div>
  );
}

export default function ShareViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 uppercase font-metadata text-xs gap-3">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span>Initializing Decryption Node...</span>
      </div>
    }>
      <ShareViewPageContent />
    </Suspense>
  );
}
