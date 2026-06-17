"use client";

import React, { useState, useEffect } from "react";
import { showToast } from "@/utils/toast";
import Link from "next/link";

export default function SettingsPage() {
  const [session, setSession] = useState<{
    authenticated: boolean;
    role: string;
    credits: number;
    identifier?: string;
  } | null>(null);

  // Preference states
  const [quality, setQuality] = useState<number>(0.65);
  const [dpi, setDpi] = useState<number>(150);
  const [stripMetadata, setStripMetadata] = useState<boolean>(true);
  const [signName, setSignName] = useState<string>("ANKIT KUMAR");
  const [quotaText, setQuotaText] = useState<string>("detecting...");

  // Load session from API
  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      }
    } catch (err) {
      console.error("Failed to fetch session:", err);
    }
  };

  // Estimate IndexDB quota
  const estimateQuota = async () => {
    if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const usageMb = ((estimate.usage || 0) / (1024 * 1024)).toFixed(1);
        const quotaGb = ((estimate.quota || 0) / (1024 * 1024 * 1024)).toFixed(1);
        setQuotaText(`${usageMb} MB / ${quotaGb} GB`);
      } catch (err) {
        console.error("Quota estimation failed:", err);
      }
    }
  };

  useEffect(() => {
    fetchSession();
    estimateQuota();

    // Load workspace preferences
    try {
      const storedQuality = localStorage.getItem("morpee_pref_quality");
      if (storedQuality) setQuality(parseFloat(storedQuality));

      const storedDpi = localStorage.getItem("morpee_pref_dpi");
      if (storedDpi) setDpi(parseInt(storedDpi, 10));

      const storedStrip = localStorage.getItem("morpee_pref_strip_metadata");
      if (storedStrip) setStripMetadata(storedStrip === "true");

      const storedSignName = localStorage.getItem("morpee_pref_sign_name");
      if (storedSignName) setSignName(storedSignName);
    } catch (err) {
      console.error("Failed to load workspace preferences:", err);
    }
  }, []);

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("morpee_pref_quality", quality.toString());
      localStorage.setItem("morpee_pref_dpi", dpi.toString());
      localStorage.setItem("morpee_pref_strip_metadata", stripMetadata.toString());
      localStorage.setItem("morpee_pref_sign_name", signName);
      
      showToast("Settings saved. Workspace defaults updated successfully.", "success");
    } catch (err) {
      console.error("Failed to save preferences:", err);
      showToast("Failed to save settings.", "error");
    }
  };

  const getPlanLabel = (role: string) => {
    if (role === "guest") return "Free Guest Pass";
    if (role === "candidate") return "Candidate Season Pass";
    if (role === "operator") return "CSC Operator Tier";
    if (role === "enterprise") return "Enterprise API Tier";
    return "Standard Account";
  };

  return (
    <main className="pt-24 pb-20 px-container-padding max-w-[1440px] mx-auto grid grid-cols-12 gap-0 border-x border-outline min-h-screen bg-background text-on-surface">
      {/* Settings Panel */}
      <section className="col-span-12 lg:col-span-8 p-6 md:p-8 flex flex-col gap-10 bg-white border-r border-outline">
        <div>
          <h1 className="font-headline-sm text-headline-sm uppercase mb-2 flex items-center gap-2 text-carbon">
            <span className="w-2 h-6 bg-primary"></span>
            Account Settings
          </h1>
          <p className="font-body-md text-secondary text-xs">
            Review account details and customize default file compiler options.
          </p>
        </div>

        {/* User Account Details Section */}
        {session ? (
          <div className="p-6 border border-carbon/15 rounded bg-surface-container-low flex flex-col gap-4">
            <h3 className="font-label-bold text-xs uppercase tracking-wider text-carbon border-b border-carbon/10 pb-1.5 flex justify-between items-center">
              <span>User Profile Info</span>
              <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[8px] tracking-widest font-metadata">
                {session.authenticated ? "Synced" : "Local Guest"}
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-metadata text-secondary block uppercase">Account Email</span>
                <span className="font-label-bold text-carbon block uppercase tracking-wide truncate">
                  {session.identifier || "guest_anonymous"}
                </span>
              </div>
              <div className="space-y-1">
                <span className="font-metadata text-secondary block uppercase">Subscription Tier</span>
                <span className="font-label-bold text-primary block uppercase tracking-wide">
                  {getPlanLabel(session.role)}
                </span>
              </div>
              <div className="space-y-1">
                <span className="font-metadata text-secondary block uppercase">Available Credits</span>
                <span className="font-label-bold text-carbon block uppercase tracking-wider">
                  {session.role === "enterprise" ? "UNLIMITED" : `${session.credits} CREDITS`}
                </span>
              </div>
              <div className="space-y-1">
                <span className="font-metadata text-secondary block uppercase">Secure Sandbox Quota</span>
                <span className="font-label-bold text-carbon block uppercase font-metadata">
                  {quotaText}
                </span>
              </div>
            </div>

            {/* Guest warning banner */}
            {!session.authenticated && (
              <div className="mt-4 p-4 border border-error/20 bg-error-container/10 text-error rounded flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-center sm:text-left">
                  <p className="font-label-bold text-[10px] uppercase">Temporary Guest Account</p>
                  <p className="font-body-md text-[11px] leading-relaxed text-secondary mt-0.5 max-w-md">
                    Your credits and preferences are saved locally on this browser. Register an account to sync credits across devices and prevent losing them.
                  </p>
                </div>
                <Link
                  href="/auth/sign-up"
                  className="px-4 py-2 bg-primary text-white hover:bg-carbon transition-colors font-label-bold text-[9px] uppercase tracking-wide rounded-full shrink-0 text-center"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="h-40 bg-surface-container-low animate-pulse rounded w-full"></div>
        )}

        {/* Workspace Preference Form */}
        <form onSubmit={saveSettings} className="space-y-8">
          <div className="space-y-4">
            <h3 className="font-label-bold text-label-bold uppercase text-carbon border-b border-carbon/15 pb-2 mb-4">
              Workspace Compiler Defaults
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-metadata text-metadata text-secondary uppercase text-[10px]">
                  Default PDF DPI Resolution
                </label>
                <select
                  value={dpi}
                  onChange={(e) => setDpi(parseInt(e.target.value, 10))}
                  className="bg-white border border-carbon font-body-md p-3 focus:outline-none focus:border-primary rounded-none text-xs"
                >
                  <option value={100}>100 DPI (Max compression / smaller file size)</option>
                  <option value={150}>150 DPI (Balanced / medium quality)</option>
                  <option value={300}>300 DPI (High Resolution / print quality)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-metadata text-metadata text-secondary uppercase text-[10px]">
                  Default Compression Quality
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="bg-white border border-carbon font-body-md p-3 focus:outline-none focus:border-primary rounded-none text-xs"
                >
                  <option value={0.4}>0.40 Quality (Maximum Shrink)</option>
                  <option value={0.65}>0.65 Quality (Balanced / Default)</option>
                  <option value={0.85}>0.85 Quality (High Detail / Sharp)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-metadata text-metadata text-secondary uppercase text-[10px]">
                Default Name for PDF Signatures & Fields
              </label>
              <input
                type="text"
                value={signName}
                onChange={(e) => setSignName(e.target.value)}
                placeholder="ANKIT KUMAR"
                className="bg-white border border-carbon font-body-md p-3 focus:outline-none focus:border-primary rounded-none text-xs"
              />
            </div>

            <div className="flex items-center justify-between border border-carbon p-4 bg-surface-container-lowest">
              <div>
                <p className="font-label-bold text-xs uppercase text-carbon">Strip Document Metadata</p>
                <p className="font-body-md text-secondary text-[11px] mt-1 max-w-md leading-relaxed">
                  Recommended. Automatically remove GPS coordinates, scanner details, and authorship tags from compressed JPEGs and PDFs to protect your privacy.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStripMetadata(!stripMetadata)}
                className={`w-16 h-8 border border-carbon relative flex items-center px-1 transition-colors ${
                  stripMetadata ? "bg-primary text-white" : "bg-surface-container"
                }`}
              >
                <div className={`w-6 h-6 bg-carbon transition-transform ${stripMetadata ? "translate-x-8" : ""}`}></div>
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="px-8 py-4 bg-carbon text-white uppercase font-label-bold text-label-bold rounded-full hover:bg-primary transition-all cursor-pointer shadow-md"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </section>

      {/* Sidebar Info */}
      <aside className="col-span-12 lg:col-span-4 p-6 md:p-8 flex flex-col justify-between bg-surface-container-low h-full gap-8">
        <div className="space-y-6">
          <h3 className="font-headline-sm text-headline-sm uppercase border-b border-carbon pb-2 text-carbon">
            System Status
          </h3>
          <div className="space-y-4 font-body-md text-xs leading-relaxed text-secondary">
            <p>
              Document uploads are processed securely. Volatile server memory holds active arrays only for compilation—files are never written to persistent disk storage.
            </p>
            <p>
              Verify file compliance in your browser sandbox using the local file vault before pushing to portals.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-carbon/10">
            <div className="flex items-center gap-2 text-xs font-label-bold text-secondary uppercase">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              IndexedDB Storage Active
            </div>
            <div className="flex items-center gap-2 text-xs font-label-bold text-secondary uppercase">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              WASM Optimization Engine Ready
            </div>
            <div className="flex items-center gap-2 text-xs font-label-bold text-secondary uppercase">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Neon Authentication Connected
            </div>
          </div>
        </div>

        <div className="border border-carbon border-dashed p-6 text-center bg-white rounded-sm">
          <span className="material-symbols-outlined text-4xl text-primary mb-2">verified_user</span>
          <p className="font-label-bold text-label-bold uppercase text-[11px] text-carbon">Secure Local Processing</p>
          <p className="font-metadata text-metadata text-secondary mt-1">Neon Auth Integration</p>
        </div>
      </aside>
    </main>
  );
}
