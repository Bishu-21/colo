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

  useEffect(() => {
    const supported = typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function";
    const timer = setTimeout(() => {
      setWasmSupported(supported);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const navLinks = [
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
          <Link href="/ops" className="hover:text-tertiary-fixed-dim text-surface-bright border border-outline px-2 py-0.5 rounded-sm md:border-0 md:p-0 transition-colors">
            [SYSTEM_STATUS]
          </Link>
        </div>
      </footer>
    </div>
  );
};

