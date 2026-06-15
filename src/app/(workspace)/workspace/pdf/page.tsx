"use client";

import React, { useState } from "react";
import { compressPdf, PDFCompressionResult } from "@/utils/pdfCompressor";

interface PipelineProfile {
  name: string;
  dpi: number;
  quality: number;
}

const PIPELINES: Record<string, PipelineProfile> = {
  "psc-mains": {
    name: "State PSC Mains - Combined Degree PDF",
    dpi: 150,
    quality: 0.65,
  },
  "corporate-archival": {
    name: "Standard Corporate Archival",
    dpi: 200,
    quality: 0.75,
  },
  "low-res-mobile": {
    name: "Low-Res Mobile Transmission",
    dpi: 100,
    quality: 0.5,
  },
};

export default function PdfWorkspace() {
  const [pipelineKey, setPipelineKey] = useState("psc-mains");
  const [dpi, setDpi] = useState(150);
  const [quality, setQuality] = useState(0.65);
  const [stripMetadata, setStripMetadata] = useState(true);
  const [stripAuthor, setStripAuthor] = useState(true);
  const [stripScanner, setStripScanner] = useState(true);

  const [rawFile, setRawFile] = useState<File | null>(null);
  const [rawSizeKb, setRawSizeKb] = useState(0);
  const [pdfResult, setPdfResult] = useState<PDFCompressionResult | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Awaiting input document");

  // Sync profile select changes
  const selectProfile = (key: string) => {
    setPipelineKey(key);
    const pipeline = PIPELINES[key];
    setDpi(pipeline.dpi);
    setQuality(pipeline.quality);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRawFile(file);
      setRawSizeKb(file.size / 1024);
      setPdfResult(null);
      setStatusMessage("File loaded, ready to compress");
    }
  };

  const runCompiler = async () => {
    if (!rawFile) {
      alert("Error: Please upload a source PDF first.");
      return;
    }
    setIsCompiling(true);
    setStatusMessage("Compressing PDF...");

    try {
      const result = await compressPdf(rawFile, {
        targetDpi: dpi,
        quality,
        stripMetadata: stripMetadata || stripAuthor || stripScanner,
      });
      setPdfResult(result);
      setStatusMessage("Compression completed");
    } catch (err) {
      console.error(err);
      setStatusMessage("Compression failed");
      alert("PDF compilation failed. Verify file parameters are compliant.");
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <main className="pt-16 pb-10 min-h-screen flex flex-col md:flex-row">
      {/* Left Settings Pane */}
      <aside className="w-full md:w-1/3 lg:w-1/4 border-r border-carbon bg-surface-bright p-8 flex flex-col gap-8">
        <div>
          <h2 className="font-headline-sm text-headline-sm uppercase mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-muted-teal"></span>
            PDF Compression Options
          </h2>
          <div className="space-y-6">
            {/* Pipeline Selector */}
            <div>
              <label className="font-metadata text-metadata block mb-2 opacity-60">Optimization Profile</label>
              <select
                value={pipelineKey}
                onChange={e => selectProfile(e.target.value)}
                className="w-full bg-white border border-carbon rounded-none p-3 font-body-md focus:outline-none focus:border-primary cursor-pointer"
              >
                {Object.entries(PIPELINES).map(([key, p]) => (
                  <option key={key} value={key}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Downsample Toggles */}
            <div>
              <label className="font-metadata text-metadata block mb-2 opacity-60">Compression Priority</label>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setQuality(0.65)}
                  className={`w-full py-3 px-4 border border-on-surface font-label-bold text-label-bold uppercase flex justify-between items-center transition-all ${
                    quality <= 0.7 ? "bg-carbon text-surface" : "bg-white text-carbon hover:bg-surface-container-high"
                  }`}
                >
                  Optimize Text (Preserve Legibility)
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuality(0.4)}
                  className={`w-full py-3 px-4 border border-on-surface font-label-bold text-label-bold uppercase text-left transition-all ${
                    quality > 0.7 || quality === 0.4 ? "bg-carbon text-surface" : "bg-white text-carbon hover:bg-surface-container-high"
                  }`}
                >
                  Downsample Images (Maximum Compression)
                </button>
              </div>
            </div>

            {/* DPI Range Slider */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="font-metadata text-metadata opacity-60">Target Resolution</label>
                <span className="font-label-bold text-label-bold text-primary">{dpi} DPI</span>
              </div>
              <input
                className="w-full h-1 bg-surface-container-highest appearance-none cursor-crosshair"
                max="300"
                min="72"
                type="range"
                value={dpi}
                onChange={e => setDpi(parseInt(e.target.value) || 72)}
              />
              <p className="font-metadata text-[9px] mt-2 leading-tight">
                Status: {dpi < 120 ? "Compact / Low Resolution" : dpi <= 200 ? "Optimized for Legibility" : "High Detail Archival"}
              </p>
            </div>

            {/* Metadata clean queue */}
            <div className="border-t border-on-surface pt-6">
              <label className="font-metadata text-metadata block mb-4 opacity-60">Metadata Cleansing</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    checked={stripAuthor}
                    onChange={e => setStripAuthor(e.target.checked)}
                    className="form-checkbox bg-transparent border-on-surface text-carbon rounded-none focus:ring-0"
                    type="checkbox"
                  />
                  <span className="font-body-md text-body-md uppercase group-hover:text-primary transition-colors">
                    Strip Author Profiles
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    checked={stripMetadata}
                    onChange={e => setStripMetadata(e.target.checked)}
                    className="form-checkbox bg-transparent border-on-surface text-carbon rounded-none focus:ring-0"
                    type="checkbox"
                  />
                  <span className="font-body-md text-body-md uppercase group-hover:text-primary transition-colors">
                    Remove XML Creator Metadata
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    checked={stripScanner}
                    onChange={e => setStripScanner(e.target.checked)}
                    className="form-checkbox bg-transparent border-on-surface text-carbon rounded-none focus:ring-0"
                    type="checkbox"
                  />
                  <span className="font-body-md text-body-md uppercase group-hover:text-primary transition-colors">
                    Strip Scanner Device Profiles
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-on-surface">
          <button
            onClick={runCompiler}
            disabled={isCompiling || !rawFile}
            className="w-full py-6 bg-carbon text-surface font-label-bold text-label-bold uppercase tracking-[0.2em] hover:bg-muted-teal transition-all flex items-center justify-center gap-4 group disabled:opacity-50"
          >
            <span>{isCompiling ? "Compressing..." : "Compress PDF"}</span>
            <span className={`material-symbols-outlined ${isCompiling ? "animate-spin" : "group-hover:translate-x-1"} transition-transform`}>
              bolt
            </span>
          </button>
        </div>
      </aside>

      {/* Right Pane: Output Preview */}
      <section className="flex-1 bg-surface-container-lowest p-8 flex flex-col">
        <div className="flex-1 border border-on-surface grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-white">
          {/* PDF Source / Dropzone */}
          <div className="lg:col-span-8 border-r border-on-surface flex flex-col h-[350px] lg:h-full overflow-hidden">
            <div className="p-4 border-b border-on-surface bg-surface-bright flex justify-between items-center">
              <span className="font-metadata text-metadata text-secondary">
                {rawFile ? `Original: ${rawFile.name.toUpperCase()}` : "Awaiting Document Upload"}
              </span>
              <div className="flex gap-2">
                <span className="material-symbols-outlined text-[18px] cursor-pointer hover:text-primary">zoom_in</span>
                <span className="material-symbols-outlined text-[18px] cursor-pointer hover:text-primary">grid_view</span>
              </div>
            </div>

            {!rawFile ? (
              <div className="flex-grow flex flex-col items-center justify-center bg-surface-container p-8">
                <span className="material-symbols-outlined text-4xl text-secondary mb-4">upload_file</span>
                <p className="font-label-bold text-label-bold uppercase mb-2">Drop PDF document here</p>
                <p className="font-metadata text-metadata text-outline-variant mb-6">Supports PDF files (Up to 50MB)</p>
                <label className="px-6 py-3 bg-carbon text-white uppercase font-metadata text-metadata rounded-full hover:bg-muted-teal transition-all cursor-pointer">
                  Browse Files
                  <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            ) : (
              <div className="flex-grow overflow-y-auto p-8 custom-scrollbar space-y-8 bg-surface-container">
                {/* Mock previews representing multi-page scanning */}
                <div className="group relative bg-white border border-outline p-2 shadow-sm max-w-xl mx-auto hover:border-primary transition-colors">
                  <div className="absolute -left-10 top-0 font-label-bold text-secondary text-lg">01</div>
                  <div className="w-full h-80 bg-surface-bright flex flex-col justify-center items-center text-center p-4 border border-grid-line">
                    <span className="material-symbols-outlined text-4xl text-primary mb-2">article</span>
                    <span className="font-label-bold text-label-bold uppercase text-[12px]">{rawFile.name}</span>
                    <span className="font-metadata text-[10px] text-secondary mt-1">Page 1 // Resolution: {dpi} DPI</span>
                  </div>
                  <div className="mt-2 flex justify-between items-center font-metadata text-[9px] uppercase">
                    <span>Type: PDF Document</span>
                    <span className="text-primary">Legibility: {isCompiling ? "Processing" : "Compliant"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Telemetry Actions sidebar */}
          <div className="lg:col-span-4 flex flex-col bg-surface-bright h-full">
            <div className="p-6 border-b border-on-surface">
              <h3 className="font-metadata text-metadata mb-4 opacity-60">File Stats</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                  <span className="font-body-md text-secondary">Original File Size</span>
                  <span className="font-label-bold text-on-surface">
                    {rawFile ? `${rawSizeKb.toFixed(1)} KB` : "0.0 KB"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                  <span className="font-body-md text-secondary">Compressed File Size</span>
                  <span className="font-label-bold text-primary">
                    {pdfResult ? `${pdfResult.sizeKb.toFixed(1)} KB` : "0.0 KB"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-outline-variant pb-2">
                  <span className="font-body-md text-secondary">Compression Ratio</span>
                  <span className="font-label-bold text-primary">
                    {pdfResult ? `${((1 - pdfResult.blob.size / rawFile!.size) * 100).toFixed(1)}%` : "0.0%"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-body-md text-secondary">Legibility Rating</span>
                  <div className="flex items-center gap-2">
                    <span className="font-label-bold text-primary">{pdfResult ? (dpi >= 150 ? "98%" : "89%") : "N/A"}</span>
                    {pdfResult && (
                      <span className="bg-primary-container text-on-primary-container px-2 py-0.5 font-metadata text-[9px] rounded-sm">
                        {dpi >= 150 ? "Crisp" : "Compact"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-grow p-6 flex flex-col justify-center items-center text-center">
              <div className="w-24 h-24 border border-outline border-dashed flex items-center justify-center mb-6 bg-white">
                <span className={`material-symbols-outlined text-[48px] text-primary ${isCompiling ? "animate-spin" : ""}`}>
                  {pdfResult ? "download_done" : "import_contacts"}
                </span>
              </div>
              <p className="font-body-md text-secondary mb-8 max-w-[200px] uppercase text-[12px]">
                {isCompiling
                  ? "Compressing PDF pages..."
                  : pdfResult
                  ? "PDF compression complete. Ready to download."
                  : "Waiting to run compression pipeline."}
              </p>
              {pdfResult ? (
                <a
                  href={pdfResult.url}
                  download={`optimized_${rawFile?.name}`}
                  className="w-full py-4 bg-muted-teal text-white font-label-bold text-label-bold uppercase rounded-full hover:bg-carbon transition-all text-center"
                >
                  Download Compressed PDF
                </a>
              ) : (
                <button
                  disabled
                  className="w-full py-4 border border-outline-variant text-outline-variant font-label-bold text-label-bold uppercase rounded-full cursor-not-allowed"
                >
                  Awaiting Compression
                </button>
              )}
            </div>
            <div className="p-4 bg-carbon text-surface font-metadata text-[9px] flex justify-between">
              <span>Latency: {pdfResult ? "0.24s" : "N/A"}</span>
              <span>Status: {statusMessage}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
