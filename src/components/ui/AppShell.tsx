"use client";

import React, { Suspense, useEffect, useState } from "react";
import WorkspaceHeader from "@/components/WorkspaceHeader";
import TelemetryTicker from "@/components/TelemetryTicker";
import Link from "next/link";

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [wasmSupported, setWasmSupported] = useState<boolean | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: string }[]>([]);

  useEffect(() => {
    const handleColoToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type?: string }>;
      if (!customEvent.detail) return;
      const { message, type = "info" } = customEvent.detail;
      const id = Math.random().toString(36).substring(2, 9);
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };
    window.addEventListener("morpee_toast", handleColoToast);
    return () => window.removeEventListener("morpee_toast", handleColoToast);
  }, []);

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
    { label: "Workspace Tools", path: "/workspace" },
    { label: "Developer API", path: "/api-hub" },
    { label: "Help & Guide", path: "/support" },
    { label: "Pro Pricing", path: "/billing" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      {/* Top Header Navigation */}
      <Suspense fallback={<div className="h-16 bg-background" />}>
        <WorkspaceHeader logo="morpee" navLinks={navLinks} />
      </Suspense>

      {/* Main Page Content Wrapper */}
      <div className="flex-grow pt-16">
        {children}
      </div>

      {/* Footer Status Bar */}
      <footer className="bg-carbon text-surface-bright font-metadata text-metadata flex justify-between px-container-padding items-center h-[50px] md:h-[40px] border-t border-outline">
        <div className="text-primary font-bold text-xs md:text-sm">
          © 2026 MORPEE
        </div>
        <div className="flex gap-4 md:gap-8 font-metadata text-[10px] md:text-metadata text-surface-variant/60 items-center">
          <span className="text-primary font-bold">
            WASM Engine: {wasmSupported === null ? "Detecting..." : wasmSupported ? "Active" : "Unsupported"}
          </span>
          <TelemetryTicker />
          <span className="hidden sm:inline">Spec Compliant</span>
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="text-tertiary-fixed-dim font-bold animate-pulse hover:text-white border border-dashed border-tertiary-fixed-dim px-2 py-0.5 rounded transition-colors cursor-pointer"
            >
              Install App
            </button>
          )}
          <Link href="/ops" className="hover:text-tertiary-fixed-dim text-surface-bright transition-colors">
            System Status
          </Link>
        </div>
      </footer>

      {/* Toast Notification Container */}
      <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded shadow-lg border text-xs font-label-bold uppercase flex items-center justify-between pointer-events-auto transition-all duration-300 ${
              toast.type === "success"
                ? "bg-primary text-white border-primary/20"
                : toast.type === "error"
                ? "bg-error text-white border-error/20"
                : "bg-surface-container-high text-on-surface border-carbon/15"
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="ml-4 text-[10px] opacity-75 hover:opacity-100 uppercase focus:outline-none cursor-pointer"
            >
              [X]
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

