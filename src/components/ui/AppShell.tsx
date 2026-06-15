"use client";

import React, { useEffect, useState } from "react";
import WorkspaceHeader from "@/components/WorkspaceHeader";
import TelemetryTicker from "@/components/TelemetryTicker";
import Link from "next/link";

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [wasmSupported, setWasmSupported] = useState<boolean | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const supported = typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function";
    const timer = setTimeout(() => {
      setWasmSupported(supported);
    }, 0);

    // In development mode, unregister any active service workers and clear caches; skip registration
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const isDev = process.env.NODE_ENV === "development" ||
                    window.location.hostname === "localhost" ||
                    window.location.hostname === "127.0.0.1";
      if (isDev) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          if (registrations.length > 0) {
            console.log("Clearing dev service workers and caches...");
            // Unregister all service workers
            const unregisterPromises = registrations.map((reg) => reg.unregister());
            Promise.all(unregisterPromises).then(() => {
              // Clear all cache keys
              if (typeof caches !== "undefined") {
                caches.keys().then((keys) => {
                  Promise.all(keys.map((key) => caches.delete(key))).then(() => {
                    console.log("Cleanup complete.");
                  });
                });
              } else {
                console.log("No cache storage to clear.");
              }
            });
          }
        });
      } else {
        // Register PWA Service Worker for offline capability in production only
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.warn("PWA service worker registration failed:", err);
        });
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      }
      setDeferredPrompt(null);
    });
  };

  const navLinks = [
    { label: "AI Scanner", path: "/workspace/scan" },
    { label: "Image Optimizer", path: "/workspace/image" },
    { label: "PDF Compressor", path: "/workspace/pdf" },
    { label: "Batch Queue", path: "/workspace/batch" },
    { label: "Developer API", path: "/api-hub" },
    { label: "Help & Guide", path: "/support" },
    { label: "Pro Pricing", path: "/billing" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      {/* Top Header Navigation */}
      <WorkspaceHeader logo="colo" navLinks={navLinks} />

      {/* Main Page Content Wrapper - Adding pb-[60px] to clear telemetry footer on mobile */}
      <div className="flex-grow pt-16 pb-[60px]">
        {children}
      </div>

      {/* Footer Status Bar */}
      <footer className="bg-carbon text-surface-bright font-metadata text-metadata uppercase fixed bottom-0 left-0 w-full z-50 flex justify-between px-container-padding items-center h-[50px] md:h-[40px] border-t border-outline">
        <div className="text-primary font-bold text-xs md:text-sm">
          (c) 2026 COLO (COMPRESSED UPLOADS)
        </div>
        <div className="flex gap-4 md:gap-8 font-metadata text-[10px] md:text-metadata uppercase text-surface-variant/60 items-center">
          <span className="text-primary font-bold">
            WASM ENGINE: {wasmSupported === null ? "DETECTING..." : wasmSupported ? "ACTIVE" : "UNSUPPORTED"}
          </span>
          <TelemetryTicker />
          <span className="hidden sm:inline">GOVT SPEC COMPLIANT</span>
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="text-tertiary-fixed-dim font-bold animate-pulse hover:text-white border border-dashed border-tertiary-fixed-dim px-2 py-0.5 rounded transition-colors cursor-pointer"
            >
              [INSTALL APP]
            </button>
          )}
          <Link href="/ops" className="hover:text-tertiary-fixed-dim text-surface-bright border border-outline px-2 py-0.5 rounded-sm md:border-0 md:p-0 transition-colors">
            [SYSTEM_STATUS]
          </Link>
        </div>
      </footer>
    </div>
  );
};

