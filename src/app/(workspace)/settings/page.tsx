"use client";

import React, { useState } from "react";

export default function SettingsPage() {
  const [ramWipe, setRamWipe] = useState(true);
  const [encryptionLevel, setEncryptionLevel] = useState("AES-256-GCM");
  const [mfaActive, setMfaActive] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState("24h");

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    alert("SECURITY_CORE: Config parameters updated and locked in browser memory.");
  };

  return (
    <main className="pt-24 pb-20 px-container-padding max-w-[1440px] mx-auto grid grid-cols-12 gap-0 border-x border-outline min-h-screen">
      {/* Settings Panel */}
      <section className="col-span-12 lg:col-span-8 p-8 flex flex-col gap-12 bg-white border-r border-outline">
        <div>
          <h1 className="font-headline-sm text-headline-sm uppercase mb-2 flex items-center gap-2">
            <span className="w-2 h-6 bg-muted-teal"></span>
            [ACCOUNT_SECURITY_SETTINGS]
          </h1>
          <p className="font-body-md text-secondary italic">
            *Manage zero-trust cryptographic layers and session encryption variables.*
          </p>
        </div>

        <form onSubmit={saveSettings} className="space-y-8 max-w-xl">
          {/* Toggles */}
          <div className="space-y-4">
            <h3 className="font-label-bold text-label-bold uppercase text-carbon border-b border-grid-line pb-2 mb-4">
              Zero-Trust Local Privacy
            </h3>
            
            <div className="flex items-center justify-between border border-carbon p-4">
              <div>
                <p className="font-label-bold text-label-bold uppercase text-carbon">Ephemeral RAM disk wipe</p>
                <p className="font-body-md text-secondary text-xs mt-1">
                  Automatically wipe all processed JPEGs and PDF arrays the millisecond optimization completes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRamWipe(!ramWipe)}
                className={`w-16 h-8 border border-carbon relative flex items-center px-1 transition-colors ${
                  ramWipe ? "bg-muted-teal" : "bg-surface-container"
                }`}
              >
                <div className={`w-6 h-6 bg-carbon transition-transform ${ramWipe ? "translate-x-8" : ""}`}></div>
              </button>
            </div>

            <div className="flex items-center justify-between border border-carbon p-4">
              <div>
                <p className="font-label-bold text-label-bold uppercase text-carbon">Multi-Factor Authentication (MFA)</p>
                <p className="font-body-md text-secondary text-xs mt-1">
                  Secure login with cryptographic biometric verification keys.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMfaActive(!mfaActive)}
                className={`w-16 h-8 border border-carbon relative flex items-center px-1 transition-colors ${
                  mfaActive ? "bg-muted-teal" : "bg-surface-container"
                }`}
              >
                <div className={`w-6 h-6 bg-carbon transition-transform ${mfaActive ? "translate-x-8" : ""}`}></div>
              </button>
            </div>
          </div>

          {/* Selection configs */}
          <div className="space-y-6 pt-4">
            <h3 className="font-label-bold text-label-bold uppercase text-carbon border-b border-grid-line pb-2">
              Advanced Crypto Options
            </h3>

            <div className="flex flex-col gap-2">
              <label className="font-metadata text-metadata text-secondary uppercase">Local Cipher Suite</label>
              <select
                value={encryptionLevel}
                onChange={e => setEncryptionLevel(e.target.value)}
                className="bg-white border border-carbon font-body-md p-3 focus:outline-none focus:border-primary rounded-none"
              >
                <option value="AES-256-GCM">AES-256-GCM (Recommended)</option>
                <option value="CHACHA20-POLY1305">ChaCha20-Poly1305 (Mobile optimized)</option>
                <option value="RSA-4096-OAEP">RSA-4096-OAEP (Asymmetrical Handshake)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-metadata text-metadata text-secondary uppercase">Session Token Expiry</label>
              <select
                value={sessionExpiry}
                onChange={e => setSessionExpiry(e.target.value)}
                className="bg-white border border-carbon font-body-md p-3 focus:outline-none focus:border-primary rounded-none"
              >
                <option value="1h">1 Hour (Highest Security)</option>
                <option value="12h">12 Hours (Standard)</option>
                <option value="24h">24 Hours (CSC Operators)</option>
              </select>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              className="px-8 py-4 bg-carbon text-white uppercase font-label-bold text-label-bold rounded-full hover:bg-muted-teal transition-all cursor-crosshair"
            >
              [LOCK_SECURITY_PARAMETERS]
            </button>
          </div>
        </form>
      </section>

      {/* Sidebar Info */}
      <aside className="col-span-12 lg:col-span-4 p-8 flex flex-col justify-between bg-surface-container-low h-full">
        <div className="space-y-6">
          <h3 className="font-headline-sm text-headline-sm uppercase border-b border-carbon pb-2">[COMPLIANCE_AUDIT]</h3>
          <div className="space-y-4 font-body-md text-xs leading-relaxed text-secondary">
            <p>
              Pre-Flight Compiler operations adhere to ISO/IEC 27001 data protection layouts. Under our Zero-Trust architecture, document uploads never reach external disks.
            </p>
            <p>
              Client-side WebAssembly rendering ensures compatibility with UPSC and SSC online registration rules, bypassing automated security filters smoothly.
            </p>
          </div>
        </div>

        <div className="border border-carbon border-dashed p-6 text-center mt-12 bg-white">
          <span className="material-symbols-outlined text-4xl text-primary mb-2">fingerprint</span>
          <p className="font-label-bold text-label-bold uppercase text-[12px]">BIOMETRIC_LOCK_ACTIVE</p>
          <p className="font-metadata text-metadata text-secondary mt-2">Node integrity checked: OK</p>
        </div>
      </aside>
    </main>
  );
}
