"use client";

import React, { useState } from "react";
import Link from "next/link";

interface Tenant {
  id: string;
  tier: string;
  status: "FLAGGED" | "NOMINAL" | "RESTRICTED";
  quota: number;
}

export default function OpsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([
    { id: "XA-449", tier: "Enterprise Platinum", status: "FLAGGED", quota: 98 },
    { id: "BC-001", tier: "Public_Dev", status: "NOMINAL", quota: 12 },
    { id: "KR-882", tier: "Internal_Staff", status: "RESTRICTED", quota: 0 }
  ]);

  const [cmdInput, setCmdInput] = useState("");
  const [consoleLog, setConsoleLog] = useState<string[]>([
    "SYS_INIT: Booting ops core...",
    "SYS_STATUS: Secure cluster Alpha mapped successfully.",
    "LAST_CMD: list --containers // RESULT: 204 Found // TIMESTAMP: 12:44:01"
  ]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput) return;

    const cmd = cmdInput.trim();
    let response = "";

    if (cmd === "reboot" || cmd.startsWith("reboot")) {
      response = "reboot: Executing secure cluster teardown sequence... Cluster reboot initiated.";
    } else if (cmd === "status") {
      response = "status: Core nominal. Temperature: 32C. CPU Load: 84.2%. Worker thread pool: OK.";
    } else if (cmd === "help") {
      response = "Available ops commands: help, reboot, status, wipe-cache, list-tenants";
    } else if (cmd === "wipe-cache") {
      response = "wipe-cache: Purging ephemeral memory disks... Wiped 4.2 GB files successfully.";
    } else if (cmd === "list-tenants") {
      response = `live tenants: ${tenants.map(t => `${t.id}(${t.status})`).join(", ")}`;
    } else {
      response = `err: Command '${cmd}' unrecognized. Enter 'help' for options.`;
    }

    setConsoleLog(prev => [...prev, `staff@core_admin:~$ ${cmd}`, response]);
    setCmdInput("");
  };

  const overrideTenant = (id: string) => {
    setTenants(prev =>
      prev.map(t => (t.id === id ? { ...t, status: "NOMINAL", quota: 50 } : t))
    );
    alert(`Ops Override: Quota limits reset for tenant ${id}.`);
  };

  const restoreTenant = (id: string) => {
    setTenants(prev =>
      prev.map(t => (t.id === id ? { ...t, status: "NOMINAL" } : t))
    );
    alert(`Ops Restore: Revoked restrictions for tenant ${id}.`);
  };

  return (
    <main className="pt-24 pb-20 px-container-padding max-w-[1440px] mx-auto grid grid-cols-12 gap-0 border-x border-outline">
      {/* Dashboard Header */}
      <header className="col-span-12 border-b border-outline p-8 flex flex-col md:flex-row justify-between items-start md:items-center bg-surface-container-low">
        <div>
          <h1 className="font-headline-sm text-headline-sm uppercase tracking-tighter">System Control Dashboard</h1>
          <p className="font-metadata text-metadata text-secondary mt-1">OPERATOR: STAFF_772 // AUTH_LEVEL: OMEGA</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-4">
          <div className="flex flex-col items-end">
            <span className="font-metadata text-metadata uppercase">Global Load</span>
            <span className="font-label-bold text-label-bold text-muted-teal">84.2% [NOMINAL]</span>
          </div>
          <div className="flex flex-col items-end border-l border-outline-variant pl-4">
            <span className="font-metadata text-metadata uppercase">Active Workers</span>
            <span className="font-label-bold text-label-bold text-primary">1,024 / 1,024</span>
          </div>
        </div>
      </header>

      {/* System Health */}
      <section className="col-span-12 md:col-span-8 border-b md:border-r border-outline relative">
        <div className="p-6 border-b border-outline bg-surface-muted flex justify-between items-center bg-white">
          <h2 className="font-label-bold text-label-bold uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-muted-teal">pause</span>
            [SYSTEM_HEALTH]
          </h2>
          <span className="font-metadata text-metadata text-secondary">REFRESH_RATE: 500ms</span>
        </div>

        <div className="grid grid-cols-2 gap-0 bg-white">
          {/* Latency Graph Simulated */}
          <div className="col-span-2 p-8 border-b border-outline h-64 relative overflow-hidden group hover:bg-carbon hover:text-white transition-colors duration-100 cursor-crosshair">
            <div className="flex justify-between font-metadata text-metadata uppercase mb-4">
              <span>Latency Output (ms)</span>
              <span className="text-error font-bold animate-pulse">ALERT: NODE_3 SPIKE</span>
            </div>
            {/* Visual simulation of high latency spike graph */}
            <div className="w-full h-32 flex items-end gap-1">
              <div className="bg-primary/20 w-full h-[20%] group-hover:bg-primary-fixed-dim"></div>
              <div className="bg-primary/20 w-full h-[25%] group-hover:bg-primary-fixed-dim"></div>
              <div className="bg-primary/20 w-full h-[22%] group-hover:bg-primary-fixed-dim"></div>
              <div className="bg-error w-full h-[85%] animate-pulse"></div>
              <div className="bg-primary/20 w-full h-[15%] group-hover:bg-primary-fixed-dim"></div>
              <div className="bg-primary/20 w-full h-[30%] group-hover:bg-primary-fixed-dim"></div>
            </div>
            <div className="absolute bottom-4 left-8 right-8 flex justify-between font-metadata text-metadata text-secondary group-hover:text-surface-variant/55">
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
              <span>NOW</span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="col-span-1 p-6 border-r border-outline flex flex-col gap-4 hover:bg-carbon group transition-colors cursor-crosshair">
            <div className="border-l-4 border-muted-teal pl-4">
              <span className="font-metadata text-metadata uppercase block group-hover:text-outline-variant">Worker Engine Status</span>
              <span className="font-label-bold text-headline-sm uppercase group-hover:text-white text-carbon">OPTIMIZED</span>
            </div>
            <div className="font-metadata text-metadata text-secondary group-hover:text-outline-variant">
              IDLE: 12%<br />
              BUSY: 88%<br />
              STALLED: 0%
            </div>
          </div>
          <div className="col-span-1 p-6 flex flex-col gap-4 hover:bg-carbon group transition-colors cursor-crosshair">
            <div className="border-l-4 border-error pl-4">
              <span className="font-metadata text-metadata uppercase block group-hover:text-outline-variant">Queue Bottlenecks</span>
              <span className="font-label-bold text-headline-sm uppercase text-error">CRITICAL_LOAD</span>
            </div>
            <div className="font-metadata text-metadata text-secondary group-hover:text-outline-variant">
              PENDING: 14.2k<br />
              RETRIES: 421<br />
              DROPPED: 2
            </div>
          </div>
        </div>
      </section>

      {/* User Monitor */}
      <section className="col-span-12 md:col-span-4 border-b border-outline bg-white flex flex-col justify-between">
        <div>
          <div className="p-6 border-b border-outline bg-surface-muted flex justify-between items-center">
            <h2 className="font-label-bold text-label-bold uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-muted-teal">monitoring</span>
              [USER_MONITOR]
            </h2>
          </div>
          <div className="divide-y divide-outline">
            {tenants.map(t => (
              <div key={t.id} className="p-6 hover:bg-carbon group transition-colors cursor-crosshair">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-label-bold text-label-bold group-hover:text-white text-carbon">TENANT_ID: {t.id}</p>
                    <p className="font-metadata text-metadata text-secondary uppercase">Tier: {t.tier}</p>
                  </div>
                  {t.status === "FLAGGED" && (
                    <div className="bg-primary-container text-on-primary-container px-2 py-0.5 text-[10px] font-bold uppercase">
                      FLAGGED
                    </div>
                  )}
                  {t.status === "RESTRICTED" && (
                    <div className="bg-error text-white px-2 py-0.5 text-[10px] font-bold uppercase">
                      RESTRICTED
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="font-metadata text-metadata uppercase group-hover:text-outline-variant text-secondary">
                    Quota Used: {t.quota}%
                  </span>
                  {t.status === "FLAGGED" ? (
                    <button
                      onClick={() => overrideTenant(t.id)}
                      className="text-primary font-label-bold text-[10px] border border-primary px-3 py-1 rounded-full group-hover:text-white group-hover:border-white transition-colors"
                    >
                      [OVERRIDE]
                    </button>
                  ) : t.status === "RESTRICTED" ? (
                    <button
                      onClick={() => restoreTenant(t.id)}
                      className="text-error font-label-bold text-[10px] border border-error px-3 py-1 rounded-full group-hover:bg-error group-hover:text-white transition-colors"
                    >
                      [RESTORE]
                    </button>
                  ) : (
                    <button
                      onClick={() => alert(`Details for tenant ${t.id} exported to operator logs.`)}
                      className="text-on-surface-variant font-label-bold text-[10px] border border-outline px-3 py-1 rounded-full group-hover:text-white group-hover:border-white transition-colors"
                    >
                      [DETAILS]
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 bg-surface-container-high text-center border-t border-outline">
          <button className="font-label-bold text-label-bold uppercase text-on-surface-variant hover:text-carbon underline decoration-2 underline-offset-4">
            View All Live Tenants
          </button>
        </div>
      </section>

      {/* Interactive Command Terminal */}
      <section className="col-span-12 p-8 bg-carbon text-white relative overflow-hidden">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2">
            <h3 className="font-label-bold text-label-bold uppercase mb-6 flex items-center gap-2 text-muted-teal">
              <span className="material-symbols-outlined">terminal</span>
              Internal Execute Command
            </h3>
            {/* Terminal output box */}
            <div className="h-40 bg-black/40 border border-outline-variant p-4 font-metadata text-[11px] leading-relaxed overflow-y-auto mb-4 custom-scrollbar">
              {consoleLog.map((log, idx) => (
                <div key={idx} className={idx % 2 === 0 ? "text-outline-variant" : "text-primary font-bold"}>
                  {log}
                </div>
              ))}
            </div>
            <form onSubmit={handleCommandSubmit} className="flex items-center border-b border-outline-variant pb-2">
              <span className="font-metadata text-metadata text-muted-teal mr-2">staff@core_admin:~$</span>
              <input
                value={cmdInput}
                onChange={e => setCmdInput(e.target.value)}
                className="bg-transparent border-none focus:outline-none w-full font-label-bold text-label-bold placeholder-outline-variant rounded-none"
                placeholder="Enter node command (e.g. status, reboot, wipe-cache, help)..."
                type="text"
              />
            </form>
          </div>
          <div className="md:col-span-1 md:border-l md:border-outline-variant md:pl-12 flex flex-col justify-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-error rounded-full animate-pulse shadow-[0_0_10px_rgba(186,26,26,0.8)]"></div>
              <span className="font-label-bold text-label-bold uppercase">Critical Override Required</span>
            </div>
            <button
              onClick={() => {
                const conf = confirm("WARNING: Destructive operations. Authorize wipe sequence?");
                if (conf) {
                  setConsoleLog(prev => [...prev, "WIPE_SEQUENCE: Triggered. 4.2 GB files purged."]);
                }
              }}
              className="w-full bg-white text-carbon font-label-bold text-label-bold py-3 uppercase hover:bg-error hover:text-white transition-all rounded-none"
            >
              [AUTHORIZE_WIPE]
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
