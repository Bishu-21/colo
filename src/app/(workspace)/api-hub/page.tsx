"use client";

import React, { useState } from "react";
import { showToast } from "@/utils/toast";

export default function ApiHub() {
  const [showLiveToken, setShowLiveToken] = useState(false);
  const [showTestToken, setShowTestToken] = useState(true);
  const [liveToken, setLiveToken] = useState("sk_live_9482_neural_4x92_alpha");
  const [testToken, setTestToken] = useState("pk_test_0012_draft_mode_enabled");

  const [copiedLive, setCopiedLive] = useState(false);
  const [copiedTest, setCopiedTest] = useState(false);

  const copyToken = (text: string, type: "live" | "test") => {
    navigator.clipboard.writeText(text);
    if (type === "live") {
      setCopiedLive(true);
      setTimeout(() => setCopiedLive(false), 2000);
    } else {
      setCopiedTest(true);
      setTimeout(() => setCopiedTest(false), 2000);
    }
  };

  const rollToken = (type: "live" | "test") => {
    const randomHex = Math.random().toString(36).substring(2, 11);
    if (type === "live") {
      setLiveToken(`sk_live_${randomHex}_neural_4x92_alpha`);
      showToast("SECURE NODE: Live API token rolled. Update client integrations immediately.", "success");
    } else {
      setTestToken(`pk_test_${randomHex}_draft_mode_enabled`);
      showToast("SECURE NODE: Sandbox test API token rolled.", "success");
    }
  };

  return (
    <main className="pt-24 px-container-padding max-w-[1440px] mx-auto grid grid-cols-12 gap-0 border-x border-outline min-h-screen pb-16">
      {/* Left Side: Token Management */}
      <section className="col-span-12 lg:col-span-5 border-r border-outline p-8 flex flex-col gap-12 bg-white">
        <div>
          <h2 className="font-headline-sm text-headline-sm uppercase mb-2">System Authentication</h2>
          <p className="font-body-md text-on-surface-variant max-w-sm">
            Manage high-entropy access keys for secure integration inside your EdTech registration flows.
          </p>
        </div>

        {/* Live Token */}
        <div className="flex flex-col gap-4 group">
          <div className="flex justify-between items-end">
            <label className="font-label-bold text-label-bold text-muted-teal">[LIVE_TOKEN]</label>
            <span className="font-metadata text-metadata text-outline">STATUS: ACTIVE</span>
          </div>
          <div className="relative">
            <input
              className="w-full bg-surface-container border border-outline px-4 py-3 font-label-bold focus:outline-none focus:border-muted-teal transition-colors rounded-none"
              readOnly
              type={showLiveToken ? "text" : "password"}
              value={liveToken}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-3 z-10">
              <button onClick={() => setShowLiveToken(!showLiveToken)} className="hover:text-primary transition-all">
                <span className="material-symbols-outlined text-[18px]">
                  {showLiveToken ? "visibility_off" : "visibility"}
                </span>
              </button>
              <button onClick={() => copyToken(liveToken, "live")} className="hover:text-primary transition-all">
                <span className="material-symbols-outlined text-[18px]">
                  {copiedLive ? "check" : "content_copy"}
                </span>
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => rollToken("live")}
              className="flex-1 border border-carbon py-2 font-label-bold text-label-bold uppercase hover:bg-carbon hover:text-white transition-all cursor-crosshair active:scale-95"
            >
              ROLL
            </button>
            <button
              onClick={() => showToast("Live token revoked. API gateway block initialized.", "error")}
              className="flex-1 border border-error text-error py-2 font-label-bold text-label-bold uppercase hover:bg-error hover:text-white transition-all cursor-crosshair active:scale-95"
            >
              REVOKE
            </button>
          </div>
        </div>

        {/* Test Token */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-end border-l-4 border-muted-teal pl-4">
            <label className="font-label-bold text-label-bold text-on-surface-variant">[TEST_TOKEN]</label>
            <span className="font-metadata text-metadata text-outline">STATUS: SANDBOX</span>
          </div>
          <div className="relative">
            <input
              className="w-full bg-surface-container border border-outline px-4 py-3 font-label-bold focus:outline-none transition-colors rounded-none"
              readOnly
              type={showTestToken ? "text" : "password"}
              value={testToken}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-3 z-10">
              <button onClick={() => setShowTestToken(!showTestToken)} className="hover:text-primary transition-all">
                <span className="material-symbols-outlined text-[18px]">
                  {showTestToken ? "visibility_off" : "visibility"}
                </span>
              </button>
              <button onClick={() => copyToken(testToken, "test")} className="hover:text-primary transition-all">
                <span className="material-symbols-outlined text-[18px]">
                  {copiedTest ? "check" : "content_copy"}
                </span>
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => rollToken("test")}
              className="flex-1 border border-carbon py-2 font-label-bold text-label-bold uppercase hover:bg-carbon hover:text-white transition-all cursor-crosshair active:scale-95"
            >
              ROLL
            </button>
            <button
              onClick={() => showToast("Sandbox environment deactivated.", "info")}
              className="flex-1 border border-outline py-2 font-label-bold text-label-bold uppercase hover:bg-carbon hover:text-white transition-all cursor-crosshair active:scale-95"
            >
              DISABLE
            </button>
          </div>
        </div>

        {/* API Constraints Readout */}
        <div className="mt-auto pt-8 border-t border-outline">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border border-outline">
              <p className="font-metadata text-metadata text-outline uppercase">Rate Limit</p>
              <p className="font-headline-sm text-headline-sm">
                5,000<span className="text-xs">/min</span>
              </p>
            </div>
            <div className="p-4 border border-outline">
              <p className="font-metadata text-metadata text-outline uppercase">Concurrent</p>
              <p className="font-headline-sm text-headline-sm">
                256<span className="text-xs">/req</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Right Side: Metrics & Charts */}
      <section className="col-span-12 lg:col-span-7 flex flex-col bg-surface-container-lowest">
        {/* Request volume */}
        <div className="p-8 border-b border-outline">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-headline-sm text-headline-sm uppercase">Request Volume</h3>
            <div className="flex gap-4">
              <span className="font-label-bold text-label-bold px-2 py-1 bg-carbon text-white uppercase">24H_CYCLE</span>
              <span className="font-label-bold text-label-bold px-2 py-1 border border-outline uppercase opacity-50 cursor-pointer">
                7D_ARCHIVE
              </span>
            </div>
          </div>
          <div className="h-48 w-full flex items-end gap-1 relative overflow-hidden group">
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-grid-pattern"></div>
            {/* Visual Bar Graph */}
            <div className="bg-muted-teal w-full transition-all duration-500 hover:bg-carbon" style={{ height: "40%" }}></div>
            <div className="bg-muted-teal w-full transition-all duration-500 hover:bg-carbon" style={{ height: "35%" }}></div>
            <div className="bg-muted-teal w-full transition-all duration-500 hover:bg-carbon" style={{ height: "60%" }}></div>
            <div className="bg-muted-teal w-full transition-all duration-500 hover:bg-carbon" style={{ height: "85%" }}></div>
            <div className="bg-muted-teal w-full transition-all duration-500 hover:bg-carbon" style={{ height: "70%" }}></div>
            <div className="bg-muted-teal w-full transition-all duration-500 hover:bg-carbon" style={{ height: "45%" }}></div>
            <div className="bg-muted-teal w-full transition-all duration-500 hover:bg-carbon" style={{ height: "30%" }}></div>
            <div className="bg-muted-teal w-full transition-all duration-500 hover:bg-carbon" style={{ height: "55%" }}></div>
            <div className="bg-muted-teal w-full transition-all duration-500 hover:bg-carbon" style={{ height: "90%" }}></div>
            <div className="bg-muted-teal w-full transition-all duration-500 hover:bg-carbon" style={{ height: "75%" }}></div>
            <div className="bg-muted-teal w-full transition-all duration-500 hover:bg-carbon" style={{ height: "40%" }}></div>
            <div className="bg-muted-teal w-full transition-all duration-500 hover:bg-carbon" style={{ height: "65%" }}></div>
          </div>
          <div className="flex justify-between mt-4 font-metadata text-metadata text-outline">
            <span>T-24H</span>
            <span>T-12H</span>
            <span>T-00H [LIVE]</span>
          </div>
        </div>

        {/* Error rates and bandwidth */}
        <div className="grid grid-cols-1 md:grid-cols-2 flex-grow">
          <div className="p-8 border-r border-outline border-b md:border-b-0 bg-white">
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-headline-sm text-headline-sm uppercase">Error Rates</h3>
              <span className="text-error font-label-bold text-label-bold">0.042%</span>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between text-xs font-label-bold">
                <span>404 NOT_FOUND</span>
                <span>12</span>
              </div>
              <div className="w-full bg-surface-container h-2">
                <div className="bg-carbon h-full" style={{ width: "15%" }}></div>
              </div>
              <div className="flex justify-between text-xs font-label-bold">
                <span>500 CORE_ERR</span>
                <span>04</span>
              </div>
              <div className="w-full bg-surface-container h-2">
                <div className="bg-error h-full" style={{ width: "5%" }}></div>
              </div>
              <div className="flex justify-between text-xs font-label-bold">
                <span>429 RATE_LIM</span>
                <span>89</span>
              </div>
              <div className="w-full bg-surface-container h-2">
                <div className="bg-muted-teal h-full" style={{ width: "45%" }}></div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white">
            <div className="flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                <h3 className="font-headline-sm text-headline-sm uppercase">Bandwidth Saved</h3>
                <span className="material-symbols-outlined text-muted-teal font-bold">bolt</span>
              </div>
              <div className="my-6">
                <p className="font-display-xl text-5xl md:text-7xl block font-bold">1.2 TB</p>
                <p className="font-metadata text-metadata uppercase tracking-tighter text-outline mt-2">
                  Edge Optimization Enabled
                </p>
              </div>
              <div className="pt-4 border-t border-outline flex justify-between">
                <div>
                  <p className="font-metadata text-metadata text-outline">CACHE HIT</p>
                  <p className="font-label-bold text-label-bold">98.4%</p>
                </div>
                <div>
                  <p className="font-metadata text-metadata text-outline">LATENCY</p>
                  <p className="font-label-bold text-label-bold">14ms</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
