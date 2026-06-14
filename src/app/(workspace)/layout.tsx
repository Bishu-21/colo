"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [latency, setLatency] = useState(12);

  // Simulate network telemetry latency adjustments
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        const next = prev + delta;
        return next > 4 && next < 30 ? next : prev;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { label: "WORKSPACE (IMG)", path: "/workspace/image" },
    { label: "WORKSPACE (PDF)", path: "/workspace/pdf" },
    { label: "BATCH_QUEUE", path: "/workspace/batch" },
    { label: "API_DEV", path: "/api-hub" },
    { label: "PREMIUM", path: "/billing" },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-10 bg-background text-on-surface">
      {/* Top Navigation Bar */}
      <header className="bg-background border-b border-on-surface flex justify-between items-center w-full px-container-padding h-16 fixed top-0 z-50">
        <div className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-widest">
          <Link href="/">[ PRE-FLIGHT COMPILER ]</Link>
        </div>
        <nav className="hidden md:flex gap-6 font-body-md text-body-md uppercase tracking-tighter items-center h-full">
          {navLinks.map(link => {
            const isActive = pathname === link.path || (link.path === "/workspace/image" && pathname.startsWith("/workspace/image"));
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`transition-colors py-1 px-2 border-b-2 flex h-full items-center ${
                  isActive
                    ? "text-on-surface border-primary font-bold"
                    : "text-secondary border-transparent hover:text-on-surface hover:bg-surface-container-high"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex gap-4">
          <Link href="/billing">
            <button className="px-4 py-2 border border-on-surface rounded-full font-label-bold text-label-bold uppercase transition-colors hover:bg-carbon hover:text-white">
              [UPGRADE]
            </button>
          </Link>
          <Link href="/settings">
            <button className="px-4 py-2 bg-primary text-on-primary font-label-bold text-label-bold uppercase transition-colors hover:bg-carbon rounded-full">
              [SETTINGS]
            </button>
          </Link>
        </div>
      </header>

      {/* Main Page Area */}
      <div className="flex-grow pt-16">
        {children}
      </div>

      {/* Footer Telemetry Ticker */}
      <footer className="bg-carbon text-surface-bright font-metadata text-metadata uppercase fixed bottom-0 left-0 w-full z-50 flex justify-between px-container-padding items-center h-[40px] border-t border-outline">
        <div className="text-primary font-bold">
          ©2026 SYSTEM_ERR_OaaS
        </div>
        <div className="flex gap-8 font-metadata text-metadata uppercase text-surface-variant/60">
          <span className="flex items-center gap-2 animate-pulse text-primary font-bold">
            <span className="w-2 h-2 bg-primary rounded-full"></span> TELEMETRY: ACTIVE
          </span>
          <span className="hidden sm:inline">LATENCY: {latency}ms</span>
          <span className="hidden sm:inline">NODES: 402/OK</span>
          <Link href="/ops" className="hover:text-tertiary-fixed-dim text-surface-bright">
            [OPS_CENTER]
          </Link>
        </div>
      </footer>
    </div>
  );
}
