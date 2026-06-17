"use client";

import React, { useState } from "react";
import Link from "next/link";

interface BatchItem {
  id: string;
  name: string;
  ref: string;
  photoSize: string;
  photoStatus: "OK" | "TOO_LARGE" | "PROCESSING";
  sigSize: string;
  sigStatus: "OK" | "TOO_SMALL" | "PROCESSING";
}

export default function BatchPortal() {
  const [items, setItems] = useState<BatchItem[]>([
    { id: "#0041", name: "Rahul_Kumar", ref: "UPSC_CSE_2026", photoSize: "38KB", photoStatus: "OK", sigSize: "22KB", sigStatus: "OK" },
    { id: "#0042", name: "Priya_Singh", ref: "SSC_CGL_2026", photoSize: "41KB", photoStatus: "OK", sigSize: "28KB", sigStatus: "OK" },
    { id: "#0043", name: "Amit_Patel", ref: "UPSC_CSE_2026", photoSize: "55KB", photoStatus: "TOO_LARGE", sigSize: "19KB", sigStatus: "TOO_SMALL" },
    { id: "#0044", name: "Siddharth_Nair", ref: "BANK_PO_2025", photoSize: "33KB", photoStatus: "OK", sigSize: "21KB", sigStatus: "OK" }
  ]);

  const [isCompilingBatch, setIsCompilingBatch] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const startBatchProcess = () => {
    setIsCompilingBatch(true);
    // Simulate compilation loop
    setTimeout(() => {
      setItems(prev =>
        prev.map(item =>
          item.id === "#0043"
            ? { ...item, photoSize: "42KB", photoStatus: "OK", sigSize: "23KB", sigStatus: "OK" }
            : item
        )
      );
      setIsCompilingBatch(false);
    }, 2000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    // Simulate drop folders
    startBatchProcess();
  };

  return (
    <main className="pt-24 px-container-padding max-w-[1440px] mx-auto space-y-8 pb-16">
      {/* Top Metric Bar */}
      <section className="grid grid-cols-1 md:grid-cols-4 border border-carbon bg-white">
        <div className="p-6 border-b md:border-b-0 md:border-r border-carbon">
          <span className="font-metadata text-metadata text-secondary block mb-1">NODE_ID</span>
          <span className="font-label-bold text-label-bold text-carbon">[ACTIVE_OPERATOR: CSC_IN_0492]</span>
        </div>
        <div className="p-6 border-b md:border-b-0 md:border-r border-carbon">
          <span className="font-metadata text-metadata text-secondary block mb-1">RESOURCES</span>
          <span className="font-label-bold text-label-bold text-carbon">[REMAINING_DAILY_CREDITS: 924 / 1000]</span>
        </div>
        <div className="p-6 border-b md:border-b-0 md:border-r border-carbon">
          <span className="font-metadata text-metadata text-secondary block mb-1">THROUGHPUT</span>
          <span className="font-label-bold text-label-bold text-carbon">[QUEUE_COMPLETED: 142]</span>
        </div>
        <div className="p-6">
          <span className="font-metadata text-metadata text-secondary block mb-1">INTEGRITY</span>
          <span className="font-label-bold text-label-bold text-primary">[BATCH_SUCCESS_RATE: 100.0%]</span>
        </div>
      </section>

      {/* Batch Drag Zone */}
      <section className="relative group">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed p-12 flex flex-col items-center justify-center text-center cursor-crosshair transition-colors min-h-[300px] ${
            dragOver ? "border-primary bg-surface-container-high" : "border-carbon bg-white hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-4xl mb-4 text-carbon">upload_file</span>
          <h2 className="font-headline-sm text-headline-sm uppercase mb-2 text-carbon">[DROP_CANDIDATE_FOLDERS_OR_ZIP_FILE]</h2>
          <p className="max-w-xl text-secondary font-body-md">
            Drops candidate folders containing photos/signatures. The system auto-matches candidate names and optimizes them to preset specs.
          </p>
          <div className="absolute top-4 left-4 font-metadata text-metadata text-secondary opacity-50">STAGING_AREA_v2.0</div>
        </div>
      </section>

      {/* Bulk Actions Header */}
      <section className="flex flex-col md:flex-row justify-between items-center border-b border-carbon pb-4 gap-4">
        <div className="flex items-center gap-4">
          <span className="font-headline-sm text-headline-sm uppercase">
            QUEUE_STATUS: {isCompilingBatch ? "COMPILING" : "STANDBY"}
          </span>
          <div className={`w-3 h-3 rounded-full ${isCompilingBatch ? "bg-primary animate-pulse" : "bg-secondary"}`}></div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {}}
            className="font-metadata text-metadata uppercase px-6 py-2 border border-carbon rounded-full hover:bg-carbon hover:text-white transition-all"
          >
            [PAUSE_QUEUE]
          </button>
          <button
            onClick={startBatchProcess}
            className="font-metadata text-metadata uppercase px-6 py-2 bg-carbon text-white rounded-full hover:bg-muted-teal transition-all"
          >
            [EXECUTE_BATCH_RESIGN]
          </button>
        </div>
      </section>

      {/* Queue Processing Table */}
      <section className="border border-carbon bg-white overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-carbon text-white font-metadata text-metadata uppercase border-b border-carbon">
                <th className="p-4 border-r border-outline">ID_HEX</th>
                <th className="p-4 border-r border-outline">CANDIDATE_NAME</th>
                <th className="p-4 border-r border-outline">APPLICATION_REF</th>
                <th className="p-4 border-r border-outline">PHOTO_STATUS</th>
                <th className="p-4 border-r border-outline">SIGNATURE_STATUS</th>
                <th className="p-4">ACTION_NODE</th>
              </tr>
            </thead>
            <tbody className="font-body-md divide-y divide-carbon">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-carbon hover:text-white transition-colors group cursor-crosshair">
                  <td className="p-4 border-r border-carbon font-bold">{item.id}</td>
                  <td className="p-4 border-r border-carbon">{item.name}</td>
                  <td className="p-4 border-r border-carbon">{item.ref}</td>
                  <td className="p-4 border-r border-carbon">
                    <span className="flex items-center gap-2">
                      <span className={`w-1 h-4 ${item.photoStatus === "OK" ? "bg-muted-teal" : "bg-error animate-pulse"}`}></span>
                      Photo ({item.photoSize}){" "}
                      <span className={`font-bold ${item.photoStatus === "OK" ? "text-primary group-hover:text-primary-fixed-dim" : "text-error"}`}>
                        [{item.photoStatus}]
                      </span>
                    </span>
                  </td>
                  <td className="p-4 border-r border-carbon">
                    <span className="flex items-center gap-2">
                      <span className={`w-1 h-4 ${item.sigStatus === "OK" ? "bg-muted-teal" : "bg-error animate-pulse"}`}></span>
                      Sig ({item.sigSize}){" "}
                      <span className={`font-bold ${item.sigStatus === "OK" ? "text-primary group-hover:text-primary-fixed-dim" : "text-error"}`}>
                        [{item.sigStatus}]
                      </span>
                    </span>
                  </td>
                  <td className="p-4 font-metadata text-metadata">
                    {item.photoStatus === "OK" && item.sigStatus === "OK" ? (
                      <button className="hover:underline">[DOWNLOAD_ZIP]</button>
                    ) : (
                      <button onClick={startBatchProcess} className="text-primary animate-pulse group-hover:text-primary-fixed-dim">
                        [RECOMPILING]
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* System Architecture Visualization (Bento Grid) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
        <div className="col-span-1 md:col-span-2 border border-carbon bg-white p-6 relative overflow-hidden h-64">
          <div className="relative z-10">
            <h3 className="font-label-bold text-label-bold uppercase mb-4">NEURAL_COMPRESSION_ENGINE_LOAD</h3>
            <div className="flex items-end gap-2 h-32">
              <div className="bg-carbon w-full h-[60%] animate-pulse"></div>
              <div className="bg-carbon w-full h-[80%]"></div>
              <div className="bg-primary w-full h-[40%]"></div>
              <div className="bg-carbon w-full h-[90%]"></div>
              <div className="bg-carbon w-full h-[55%] animate-pulse"></div>
              <div className="bg-primary w-full h-[75%]"></div>
              <div className="bg-carbon w-full h-[30%]"></div>
            </div>
          </div>
          <div className="absolute bottom-4 right-4 font-metadata text-metadata text-secondary">LOAD: OPTIMAL</div>
        </div>

        <div className="border border-carbon bg-white p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-label-bold text-label-bold uppercase mb-2">AUTH_STATUS</h3>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">verified_user</span>
              <span className="font-metadata text-metadata">VERIFIED_BIOMETRIC_LINK</span>
            </div>
          </div>
          <div className="border-t border-carbon pt-4">
            <p className="font-metadata text-metadata text-secondary mb-4">LAST_LOGIN: SECURE_SESSION</p>
            <Link href="/auth" className="block w-full py-2 bg-on-error text-error border border-error font-metadata text-metadata uppercase hover:bg-error hover:text-white transition-colors text-center">
              [TERMINATE_SESSION]
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
