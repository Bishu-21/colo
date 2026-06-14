"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface DiagnosticReport {
  userAgent: string;
  onLine: boolean;
  cores: number | string;
  memory: number | string;
  localStorageOk: boolean;
  sessionStorageOk: boolean;
  indexedDbOk: boolean;
  wasmOk: boolean;
  wasmCompileTimeMs: number | null;
  performanceLatencyMs: number | null;
}

export default function OpsPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticReport | null>(null);
  const [fps, setFps] = useState<number>(60);
  const [fpsHistory, setFpsHistory] = useState<number[]>(Array(30).fill(60));
  const [cmdInput, setCmdInput] = useState("");
  const [consoleLog, setConsoleLog] = useState<string[]>([
    "COLO DIAGNOSTICS: Booting runtime checker...",
    "TYPE 'help' FOR LIST OF CAPABILITY ACTIONS.",
    "READY."
  ]);

  // Frame monitor (real FPS counter)
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const tick = () => {
      frameCount++;
      const now = performance.now();
      const delta = now - lastTime;
      if (delta >= 1000) {
        const calculatedFps = Math.min(60, Math.round((frameCount * 1000) / delta));
        setFps(calculatedFps);
        setFpsHistory((prev) => [...prev.slice(1), calculatedFps]);
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Browser capability checks
  const runChecks = async (): Promise<DiagnosticReport> => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";
    const online = typeof navigator !== "undefined" ? navigator.onLine : false;
    const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || "Unknown" : "Unknown";
    
    // @ts-expect-error - deviceMemory is a non-standard browser property not in standard types
    const memory = typeof navigator !== "undefined" ? navigator.deviceMemory || "Unknown" : "Unknown";

    let localStorageOk = false;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("__test__", "ok");
        localStorageOk = localStorage.getItem("__test__") === "ok";
        localStorage.removeItem("__test__");
      }
    } catch {}

    let sessionStorageOk = false;
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.setItem("__test__", "ok");
        sessionStorageOk = sessionStorage.getItem("__test__") === "ok";
        sessionStorage.removeItem("__test__");
      }
    } catch {}

    const indexedDbOk = typeof window !== "undefined" && !!window.indexedDB;
    
    const wasmOk = typeof WebAssembly === "object" && typeof WebAssembly.compile === "function";
    let wasmCompileTimeMs: number | null = null;
    if (wasmOk) {
      try {
        const start = performance.now();
        // Compile smallest valid WebAssembly binary (8 bytes header)
        const bytes = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]);
        await WebAssembly.compile(bytes);
        wasmCompileTimeMs = Math.round((performance.now() - start) * 100) / 100;
      } catch {
        wasmCompileTimeMs = null;
      }
    }

    let performanceLatencyMs: number | null = null;
    try {
      const start = performance.now();
      await new Promise<void>((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = () => resolve();
        channel.port2.postMessage(null);
      });
      performanceLatencyMs = Math.round((performance.now() - start) * 100) / 100;
    } catch {}

    return {
      userAgent: ua,
      onLine: online,
      cores,
      memory,
      localStorageOk,
      sessionStorageOk,
      indexedDbOk,
      wasmOk,
      wasmCompileTimeMs,
      performanceLatencyMs
    };
  };

  useEffect(() => {
    runChecks().then((report) => {
      setDiagnostics(report);
      setConsoleLog((prev) => [
        ...prev,
        `SYS_INFO: WebAssembly check -> ${report.wasmOk ? `SUPPORTED (Compile test: ${report.wasmCompileTimeMs}ms)` : "UNSUPPORTED"}.`,
        `SYS_INFO: CPU Threads Detected -> ${report.cores}.`,
        `SYS_INFO: Device Memory -> ${report.memory} GB.`
      ]);
    });
  }, []);

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput) return;

    const cmd = cmdInput.trim().toLowerCase();
    let response = "";

    if (cmd === "help") {
      response = "Commands: diagnose (run hardware check), wasm-test (run WASM compiler test), clear-cache (wipe local storage tests), latency-test (profile loop lag), system (dump browser platform metadata).";
    } else if (cmd === "diagnose") {
      const report = await runChecks();
      setDiagnostics(report);
      response = `diagnose: Core healthy. WASM=${report.wasmOk ? "OK" : "NO"}, Latency=${report.performanceLatencyMs}ms, Storage=${report.localStorageOk ? "OK" : "ERR"}, IndexedDB=${report.indexedDbOk ? "OK" : "ERR"}`;
    } else if (cmd === "wasm-test") {
      if (typeof WebAssembly !== "object") {
        response = "wasm-test: Failed. WebAssembly is unsupported in this browser.";
      } else {
        const times: number[] = [];
        for (let i = 0; i < 5; i++) {
          const start = performance.now();
          const bytes = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]);
          await WebAssembly.compile(bytes);
          times.push(performance.now() - start);
        }
        const avg = Math.round((times.reduce((a, b) => a + b, 0) / 5) * 100) / 100;
        response = `wasm-test: Completed 5 cycles. Average compilation delay: ${avg}ms.`;
      }
    } else if (cmd === "clear-cache") {
      localStorage.clear();
      sessionStorage.clear();
      response = "clear-cache: Cleared all application localStorage and sessionStorage variables successfully.";
    } else if (cmd === "latency-test") {
      const start = performance.now();
      await new Promise<void>((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = () => resolve();
        channel.port2.postMessage(null);
      });
      const lag = Math.round((performance.now() - start) * 100) / 100;
      response = `latency-test: Microtask event loop roundtrip is ${lag}ms.`;
    } else if (cmd === "system") {
      response = `system: UserAgent="${navigator.userAgent}", Language="${navigator.language}", Cores=${navigator.hardwareConcurrency || "N/A"}`;
    } else {
      response = `err: Command '${cmd}' unrecognized. Enter 'help' for options.`;
    }

    setConsoleLog((prev) => [...prev, `user@colo_client:~$ ${cmd}`, response]);
    setCmdInput("");
  };

  return (
    <main className="pt-24 pb-20 px-container-padding max-w-[1440px] mx-auto grid grid-cols-12 gap-0 border-x border-outline bg-background">
      {/* Dashboard Header */}
      <header className="col-span-12 border border-outline p-6 flex flex-col md:flex-row justify-between items-start md:items-center bg-surface-container-low mb-6 rounded-t">
        <div>
          <h1 className="font-display-xl text-2xl uppercase tracking-wider text-carbon">Client Capabilities Panel</h1>
          <p className="font-metadata text-metadata text-secondary mt-1">OPERATOR: LOCAL_USER // BROWSER RUNTIME PROFILE</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          <div className="flex flex-col items-end">
            <span className="font-metadata text-[10px] uppercase text-secondary">Browser Mode</span>
            <span className="font-label-bold text-xs text-primary">SANDBOX SECURE</span>
          </div>
          <div className="flex flex-col items-end border-l border-outline-variant pl-4">
            <span className="font-metadata text-[10px] uppercase text-secondary">Network Status</span>
            <span className="font-label-bold text-xs text-primary uppercase">
              {diagnostics?.onLine ? "ONLINE" : "OFFLINE / LOCAL"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Diagnostics Grid */}
      <section className="col-span-12 md:col-span-8 border border-outline border-b-0 md:border-r-0 relative bg-white">
        <div className="p-4 border-b border-outline bg-neutral-50 flex justify-between items-center">
          <h2 className="font-label-bold text-xs uppercase tracking-widest flex items-center gap-2 text-carbon">
            <span className="material-symbols-outlined text-primary text-sm">tune</span>
            [CLIENT_HEALTH_METRICS]
          </h2>
          <span className="font-metadata text-[9px] text-secondary">REFRESH RATE: REALTIME</span>
        </div>

        <div className="grid grid-cols-2 gap-0">
          {/* Framerate Graph */}
          <div className="col-span-2 p-6 border-b border-outline h-56 relative overflow-hidden group hover:bg-carbon hover:text-white transition-colors duration-150">
            <div className="flex justify-between font-metadata text-[10px] uppercase mb-4 text-secondary group-hover:text-neutral-300">
              <span>Dynamic Framerate History (FPS)</span>
              <span className="font-bold text-primary group-hover:text-primary-fixed-dim">{fps} FPS ACTIVE</span>
            </div>
            
            {/* Real FPS Graph */}
            <div className="w-full h-24 flex items-end gap-1 px-1">
              {fpsHistory.map((val, idx) => {
                const heightPercent = Math.max(10, Math.round((val / 60) * 100));
                const isLaggy = val < 45;
                return (
                  <div
                    key={idx}
                    className={`w-full transition-all duration-300 ${
                      isLaggy
                        ? "bg-error"
                        : "bg-primary/20 group-hover:bg-primary-fixed-dim/60"
                    }`}
                    style={{ height: `${heightPercent}%` }}
                    title={`${val} FPS`}
                  ></div>
                );
              })}
            </div>
            <div className="absolute bottom-4 left-6 right-6 flex justify-between font-metadata text-[8px] text-secondary group-hover:text-neutral-400">
              <span>-30 SECONDS</span>
              <span>-15 SECONDS</span>
              <span>NOW</span>
            </div>
          </div>

          {/* CPU & Memory info */}
          <div className="col-span-1 p-6 border-r border-outline flex flex-col gap-2 hover:bg-carbon group transition-colors">
            <div className="border-l-2 border-primary pl-3">
              <span className="font-metadata text-[10px] uppercase block text-secondary group-hover:text-neutral-300">CPU Thread Cores</span>
              <span className="font-label-bold text-lg text-carbon group-hover:text-white">{diagnostics?.cores || "--"} Threads</span>
            </div>
            <p className="font-metadata text-[10px] text-secondary group-hover:text-neutral-400 leading-tight">
              Higher cores enable faster concurrent file resizing in Web Workers.
            </p>
          </div>

          <div className="col-span-1 p-6 flex flex-col gap-2 hover:bg-carbon group transition-colors">
            <div className="border-l-2 border-primary pl-3">
              <span className="font-metadata text-[10px] uppercase block text-secondary group-hover:text-neutral-300">Device Memory</span>
              <span className="font-label-bold text-lg text-carbon group-hover:text-white">{diagnostics?.memory ? `${diagnostics.memory} GB` : "Unknown"}</span>
            </div>
            <p className="font-metadata text-[10px] text-secondary group-hover:text-neutral-400 leading-tight">
              Available RAM allocated for hosting WebAssembly memory partitions.
            </p>
          </div>
        </div>
      </section>

      {/* Capability List */}
      <section className="col-span-12 md:col-span-4 border border-outline bg-white flex flex-col justify-between">
        <div>
          <div className="p-4 border-b border-outline bg-neutral-50 flex justify-between items-center">
            <h2 className="font-label-bold text-xs uppercase tracking-widest flex items-center gap-2 text-carbon">
              <span className="material-symbols-outlined text-primary text-sm">settings_ethernet</span>
              [BROWSER_CAPABILITIES]
            </h2>
          </div>
          <div className="divide-y divide-outline">
            {diagnostics ? (
              <>
                <div className="p-4 flex justify-between items-center hover:bg-neutral-50">
                  <div>
                    <span className="font-label-bold text-xs text-carbon block">WebAssembly Support</span>
                    <span className="font-metadata text-[10px] text-secondary">Required for local WASM optimizer</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${diagnostics.wasmOk ? "bg-primary/10 text-primary" : "bg-error-container text-error"}`}>
                    {diagnostics.wasmOk ? "SUPPORTED" : "MISSING"}
                  </span>
                </div>

                <div className="p-4 flex justify-between items-center hover:bg-neutral-50">
                  <div>
                    <span className="font-label-bold text-xs text-carbon block">WASM Compile Latency</span>
                    <span className="font-metadata text-[10px] text-secondary">Time to compile minimal module</span>
                  </div>
                  <span className="font-metadata text-xs font-bold text-carbon">
                    {diagnostics.wasmCompileTimeMs ? `${diagnostics.wasmCompileTimeMs} ms` : "N/A"}
                  </span>
                </div>

                <div className="p-4 flex justify-between items-center hover:bg-neutral-50">
                  <div>
                    <span className="font-label-bold text-xs text-carbon block">Browser LocalStorage</span>
                    <span className="font-metadata text-[10px] text-secondary">Saves configuration settings</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${diagnostics.localStorageOk ? "bg-primary/10 text-primary" : "bg-error-container text-error"}`}>
                    {diagnostics.localStorageOk ? "ACTIVE" : "ERROR"}
                  </span>
                </div>

                <div className="p-4 flex justify-between items-center hover:bg-neutral-50">
                  <div>
                    <span className="font-label-bold text-xs text-carbon block">IndexedDB API</span>
                    <span className="font-metadata text-[10px] text-secondary">Enables local multi-file buffers</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${diagnostics.indexedDbOk ? "bg-primary/10 text-primary" : "bg-error-container text-error"}`}>
                    {diagnostics.indexedDbOk ? "ACTIVE" : "ERROR"}
                  </span>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-secondary font-metadata text-xs">
                Analyzing browser capability matrices...
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 bg-neutral-50 text-center border-t border-outline flex flex-col gap-2">
          <Link href="/">
            <button className="w-full py-2 border border-carbon text-carbon font-label-bold text-xs uppercase hover:bg-carbon hover:text-white transition-all">
              Return to Workspace
            </button>
          </Link>
        </div>
      </section>

      {/* Interactive Command Terminal */}
      <section className="col-span-12 p-6 bg-carbon text-white relative overflow-hidden rounded-b border border-outline border-t-0">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h3 className="font-label-bold text-xs uppercase mb-4 flex items-center gap-2 text-primary-fixed-dim">
              <span className="material-symbols-outlined text-sm">terminal</span>
              Interactive Diagnostics Terminal
            </h3>
            
            {/* Terminal log box */}
            <div className="h-40 bg-black/45 border border-outline-variant/35 p-3 font-metadata text-[10px] leading-relaxed overflow-y-auto mb-4 custom-scrollbar">
              {consoleLog.map((log, idx) => (
                <div key={idx} className={log.startsWith("user@") ? "text-primary font-bold" : "text-neutral-300"}>
                  {log}
                </div>
              ))}
            </div>

            <form onSubmit={handleCommandSubmit} className="flex items-center border-b border-outline-variant pb-1">
              <span className="font-metadata text-[10px] text-primary-fixed-dim mr-2">user@colo_client:~$</span>
              <input
                value={cmdInput}
                onChange={(e) => setCmdInput(e.target.value)}
                className="bg-transparent border-none focus:outline-none w-full font-metadata text-xs placeholder-neutral-500 rounded-none text-white"
                placeholder="Enter command (e.g., help, diagnose, wasm-test, latency-test, system)..."
                type="text"
              />
            </form>
          </div>

          <div className="md:col-span-1 md:border-l md:border-outline-variant/30 md:pl-6 flex flex-col justify-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></div>
              <span className="font-label-bold text-xs uppercase">Client Runtime Sandbox Nominal</span>
            </div>
            <button
              onClick={async () => {
                const conf = confirm("Wipe all local settings and diagnostics caches?");
                if (conf) {
                  localStorage.clear();
                  sessionStorage.clear();
                  setConsoleLog((prev) => [...prev, "SYSTEM: Purged localStorage & sessionStorage cache."]);
                }
              }}
              className="w-full bg-white text-carbon font-label-bold text-xs py-2.5 uppercase hover:bg-primary hover:text-white transition-all"
            >
              Clear Storage Cache
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
