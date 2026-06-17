"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

const DEMO_PRESETS = {
  "upsc-photo": {
    name: "UPSC Photo Spec",
    label: "Passport Photo (UPSC)",
    sourceSize: "4.2 MB",
    compiledSize: "45 KB",
    quality: 88,
    telemetry: "UPSC Compliant // 45.2 KB",
    rawImg: "/raw-passport.jpg",
    compImg: "/optimized-passport.jpg",
    isGrayscale: false,
    isPdf: false
  },
  "ssc-signature": {
    name: "SSC Signature Spec",
    label: "Signature scan (SSC)",
    sourceSize: "1.8 MB",
    compiledSize: "14 KB",
    quality: 92,
    telemetry: "SSC Compliant // 14.2 KB",
    rawImg: "/raw-passport.jpg",
    compImg: "/optimized-passport.jpg",
    isGrayscale: true,
    isPdf: false
  },
  "pdf-cert": {
    name: "Combined PDF Certificate",
    label: "PDF Certificate (All Exams)",
    sourceSize: "12.4 MB",
    compiledSize: "412 KB",
    quality: 75,
    telemetry: "PDF Compliant // 412.3 KB",
    rawImg: "/raw-passport.jpg",
    compImg: "/optimized-passport.jpg",
    isGrayscale: false,
    isPdf: true
  }
};

const FEATURE_TABS = [
  {
    id: "edit",
    title: "Document Editing",
    features: [
      { name: "Advanced PDF Editor", desc: "Modify document pages, draw annotations, and insert shapes directly." },
      { name: "Text Annotations", desc: "Add highlight marks, text boxes, and quick comments for clarification." },
      { name: "Interactive Fillable Forms", desc: "Create, edit, and fill out interactive PDF form fields seamlessly." },
      { name: "Page Rotation & Reordering", desc: "Easily rotate crooked certificate scans or drag pages to reorder." },
      { name: "Page Deletion", desc: "Remove unwanted, blank, or extra pages from combined documents." }
    ]
  },
  {
    id: "assembly",
    title: "File Assembly & Conversion",
    features: [
      { name: "Document Merging", desc: "Combine separate certificates, transcripts, and ID cards into one PDF." },
      { name: "Document Splitting", desc: "Extract specific pages or break a multi-page PDF into single sheets." },
      { name: "Microsoft Office Conversion", desc: "Convert Word documents, Excel sheets, and PPT slides to PDF." },
      { name: "Image to PDF Conversion", desc: "Convert passport size photo scans or signature PNGs directly to PDF." },
      { name: "Batch File Processing", desc: "Optimize, resize, and compress multiple documents in a single queue." }
    ]
  },
  {
    id: "optimization",
    title: "Advanced Optimization",
    features: [
      { name: "File Compression", desc: "Multi-stage compression to target exact government file size caps." },
      { name: "Optical Character Recognition (OCR)", desc: "Extract editable text from scanned certificate PDFs automatically." },
      { name: "Custom Watermarking", desc: "Stamp watermarks or notes to protect your sensitive certificates." },
      { name: "Data Redaction", desc: "Permanently blackout sensitive details like Aadhaar numbers before upload." }
    ]
  },
  {
    id: "security",
    title: "Security & Access",
    features: [
      { name: "Password Protection & Removal", desc: "Encrypt files or decrypt password-locked PDF sheets." },
      { name: "Electronic Signatures (e-Sign)", desc: "Draw, type, or import your signature safely to sign forms." },
      { name: "Cloud Drive Integration", desc: "Import and save documents directly from Google Drive or Dropbox." },
      { name: "Secure Hybrid Processing", desc: "Upload files securely over HTTPS; processing runs on authenticated servers with no persistent storage." },
      { name: "Mobile App Access", desc: "Crop photos, sign forms, and compress files on any mobile browser." }
    ]
  }
];

export default function LandingPage() {
  const [activePreset, setActivePreset] = useState<"upsc-photo" | "ssc-signature" | "pdf-cert">("upsc-photo");
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState("edit");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [session, setSession] = useState<{
    authenticated: boolean;
    role: string;
    credits: number;
    identifier?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then(setSession)
      .catch((err) => console.error("Failed to load session:", err));
  }, []);

  const getWorkspaceLink = (toolId: string) => {
    if (session?.authenticated) {
      return `/workspace?tool=${toolId}`;
    }
    return `/auth/sign-in?redirect=${encodeURIComponent(`/workspace?tool=${toolId}`)}`;
  };

  const [storyOpen, setStoryOpen] = useState(false);

  useEffect(() => {
    if (!storyOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStoryOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [storyOpen]);

  const currentPreset = DEMO_PRESETS[activePreset];

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isResizing) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isResizing) return;
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => setIsResizing(false);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, []);

  return (
    <main className="max-w-[1440px] mx-auto px-container-padding pt-8 pb-16">
      {/* Compact Title Section */}
      <section className="mb-12 border-b border-carbon/15 pb-8 pt-4 text-center max-w-4xl mx-auto flex flex-col items-center gap-6">
        <div>
          <h1 className="font-display-xl text-4xl sm:text-5xl text-carbon mb-3 uppercase tracking-wider">
            morpee
          </h1>
          <p className="font-body-md text-sm sm:text-base text-secondary max-w-2xl mx-auto">
            Secure hybrid document resizer, scanner, and compressor for government portals (UPSC, SSC, NTA).
          </p>
        </div>
        <button
          onClick={() => setStoryOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 border-2 border-carbon rounded-full font-label-bold text-xs uppercase hover:bg-surface-container-high transition-all cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
        >
          <span className="material-symbols-outlined text-[18px]">auto_stories</span>
          <span>Why morpee? Read the Comic Story 📖</span>
        </button>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={getWorkspaceLink("scan")} prefetch={false} className="px-6 py-3 bg-primary text-surface-bright rounded-full font-label-bold text-xs uppercase hover:bg-muted-teal transition-all flex items-center gap-2 shadow-md cursor-pointer">
            <span>AI Document Scanner</span>
            <span className="material-symbols-outlined text-[16px]">document_scanner</span>
          </Link>
          <Link href={getWorkspaceLink("image")} prefetch={false} className="px-6 py-3 bg-carbon text-surface-bright rounded-full font-label-bold text-xs uppercase hover:bg-muted-teal transition-all flex items-center gap-2 shadow-md cursor-pointer">
            <span>Photo & Signature Resizer</span>
            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
          </Link>
          <Link href={getWorkspaceLink("pdf-compressor")} prefetch={false} className="px-6 py-3 border border-carbon bg-white text-carbon rounded-full font-label-bold text-xs uppercase hover:bg-surface-container-high transition-all flex items-center gap-2 cursor-pointer">
            <span>PDF Compressor</span>
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
          </Link>
        </div>
      </section>


      {/* Interactive Demo Pod Section */}
      <section className="structural-border bg-white mb-12 overflow-hidden flex flex-col lg:flex-row h-auto lg:h-[550px] rounded-lg shadow-xl">
        {/* Left Side: Preset Controllers */}
        <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-carbon p-6 md:p-8 bg-surface-container-lowest flex flex-col justify-between">
          <div>
            <div className="mb-6 border-b border-carbon/10 pb-2">
              <span className="font-metadata text-xs uppercase tracking-wider text-secondary">Demo Presets</span>
            </div>
            
            <label className="block font-label-bold text-label-bold uppercase mb-4 text-secondary">
              Exams Spec Presets
            </label>
            
            <div className="space-y-2 mb-6">
              <button
                onClick={() => setActivePreset("upsc-photo")}
                className={`w-full p-4 border text-left font-body-md flex justify-between items-center transition-all ${
                  activePreset === "upsc-photo"
                    ? "bg-carbon text-white border-carbon shadow-md"
                    : "border-outline-variant text-secondary hover:bg-surface-container-high"
                }`}
              >
                <span>Passport Photo (UPSC)</span>
                {activePreset === "upsc-photo" && (
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                )}
              </button>

              <button
                onClick={() => setActivePreset("ssc-signature")}
                className={`w-full p-4 border text-left font-body-md flex justify-between items-center transition-all ${
                  activePreset === "ssc-signature"
                    ? "bg-carbon text-white border-carbon shadow-md"
                    : "border-outline-variant text-secondary hover:bg-surface-container-high"
                }`}
              >
                <span>Signature Scan (SSC)</span>
                {activePreset === "ssc-signature" && (
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                )}
              </button>

              <button
                onClick={() => setActivePreset("pdf-cert")}
                className={`w-full p-4 border text-left font-body-md flex justify-between items-center transition-all ${
                  activePreset === "pdf-cert"
                    ? "bg-carbon text-white border-carbon shadow-md"
                    : "border-outline-variant text-secondary hover:bg-surface-container-high"
                }`}
              >
                <span>PDF Certificate Spec</span>
                {activePreset === "pdf-cert" && (
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                )}
              </button>
            </div>
          </div>

          {/* Dynamic Specs details based on current preset */}
          <div className="space-y-4 pt-4 border-t border-carbon/10">
            <div className="bg-surface-container-low p-4 font-metadata text-[10px] leading-relaxed uppercase tracking-wider text-carbon space-y-1.5 border border-carbon/15 rounded-sm shadow-inner">
              <div className="flex justify-between border-b border-carbon/10 pb-1 font-bold text-primary">
                <span>Active Spec</span>
                <span>{currentPreset.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Target Portal</span>
                <span>{activePreset === "pdf-cert" ? "NTA / JEE / NEET" : activePreset === "ssc-signature" ? "SSC CGL / CHSL" : "UPSC CSE / CDS"}</span>
              </div>
              <div className="flex justify-between">
                <span>Source File</span>
                <span className="text-error font-semibold">{currentPreset.sourceSize}</span>
              </div>
              <div className="flex justify-between">
                <span>Compressed Cap</span>
                <span className="text-primary font-bold">{currentPreset.compiledSize}</span>
              </div>
              <div className="flex justify-between">
                <span>Optimization Mode</span>
                <span>{currentPreset.isPdf ? "PDF RASTER" : currentPreset.isGrayscale ? "GS FIT" : "COLOR CROP"}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-metadata text-metadata mb-2">
                <span>TARGET QUALITY</span>
                <span className="text-primary font-bold">{currentPreset.quality}%</span>
              </div>
              <div className="h-1 bg-outline-variant w-full relative rounded-full overflow-hidden">
                <div 
                  className="absolute h-full bg-primary transition-all duration-500" 
                  style={{ width: `${currentPreset.quality}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-metadata text-metadata mb-2">
                <span>EDGE PRESERVATION</span>
                <span className="text-primary font-bold">
                  {activePreset === "pdf-cert" ? "DPI Optimized" : "Active"}
                </span>
              </div>
              <div className="h-1 bg-outline-variant w-full relative rounded-full overflow-hidden">
                <div 
                  className="absolute h-full bg-primary transition-all duration-500" 
                  style={{ width: activePreset === "pdf-cert" ? "75%" : "100%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Comparison Slider Frame */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="w-full lg:w-2/3 relative select-none bg-surface-dim overflow-hidden flex items-center justify-center p-6 md:p-8 h-[350px] lg:h-full cursor-crosshair"
        >
          {/* Status Overlay */}
          <div className="absolute top-4 right-4 z-20">
            <span className="bg-primary text-on-primary px-3 py-1 font-metadata text-xs uppercase tracking-widest rounded border border-primary-fixed-dim/20 shadow-md">
              {currentPreset.telemetry}
            </span>
          </div>

          <div className="relative w-full h-full border border-carbon/20 overflow-hidden shadow-2xl rounded bg-[#f0ede9] flex items-center justify-center">
            {/* Before (Source / Raw Image) */}
            <div className="absolute inset-0 flex items-center justify-center p-4 bg-[#f0ede9]">
              {currentPreset.isPdf ? (
                /* Rich PDF Certificate simulation: raw scan version */
                <div className="w-full h-full grid grid-cols-3 gap-2 p-2 sm:p-4 bg-[#e9e5e0] border border-dashed border-carbon/40 rounded">
                  {[1, 2, 3].map((page) => (
                    <div key={page} className="bg-[#f2efe9] shadow border border-carbon/20 rounded flex flex-col justify-between p-2 relative overflow-hidden select-none filter blur-[0.4px]">
                      {/* Decorative Gold Certificate Border */}
                      <div className="absolute inset-1 border border-amber-800/30 rounded-sm pointer-events-none"></div>
                      <div className="absolute inset-1.5 border border-dashed border-amber-800/20 rounded-sm pointer-events-none"></div>
                      
                      <div className="z-10 flex flex-col items-center">
                        <span className="font-serif text-[6px] tracking-tighter text-amber-900 font-bold leading-none scale-90">CERTIFICATE</span>
                        <div className="w-3/4 h-[2px] bg-neutral-300 mt-1.5"></div>
                        <div className="w-1/2 h-[2px] bg-neutral-300 mt-0.5"></div>
                        <div className="w-[85%] h-[2px] bg-neutral-300 mt-1.5"></div>
                        <div className="w-2/3 h-[2px] bg-neutral-300 mt-0.5"></div>
                      </div>
                      
                      {/* Seal and Signature */}
                      <div className="z-10 flex justify-between items-end mt-2 px-1">
                        <div className="w-3 h-3 rounded-full bg-amber-600/30 border border-amber-800/40 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-700/40"></div>
                        </div>
                        <div className="flex flex-col items-center">
                          <svg className="w-5 h-2 text-neutral-400" viewBox="0 0 20 8" fill="none" stroke="currentColor" strokeWidth="0.5">
                            <path d="M 2 6 Q 5 2 8 5 T 12 3 T 15 5 T 18 4" />
                          </svg>
                          <div className="w-6 h-[0.5px] bg-neutral-300"></div>
                        </div>
                      </div>

                      <div className="font-metadata text-[8px] text-right mt-2 text-carbon/40 select-none z-10">PAGE {page}</div>
                      <div className="absolute top-2 left-2 text-[6px] font-metadata text-error font-bold bg-error-container/85 px-1 border border-error/20 rounded-sm z-10">
                        Raw ({page === 1 ? "4.1" : page === 2 ? "3.8" : "4.5"}MB)
                      </div>
                    </div>
                  ))}
                </div>
              ) : currentPreset.isGrayscale ? (
                /* Signature background with muddy background noise and shadow vignette */
                <div className="relative w-full h-full flex items-center justify-center bg-[#e4dfd7] overflow-hidden w-full p-8">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.12)_100%)] pointer-events-none"></div>
                  <div className="w-full max-w-[280px] opacity-80 blur-[0.6px] select-none text-[#1b2b4d] flex flex-col items-center">
                    <svg viewBox="0 0 300 100" className="w-full h-auto" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                      <path d="M 30 50 C 45 40, 50 20, 60 30 C 70 45, 60 70, 75 65 C 90 60, 105 45, 115 48 C 125 50, 120 60, 130 58 C 145 55, 160 35, 175 40 C 190 45, 175 68, 195 62 C 215 55, 230 38, 250 42 C 270 45, 280 55, 290 50" />
                      <path d="M 50 75 Q 160 85 270 70" opacity="0.6" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="absolute top-2 left-2 font-metadata text-[9px] text-error bg-error-container/90 border border-error/30 px-2 py-0.5 rounded shadow-sm">
                    Background Shadows (1.8MB)
                  </div>
                </div>
              ) : (
                /* Portrait photo raw: Realistic UPSC passport photo card */
                <div className="relative h-[90%] aspect-[3.5/4.5] bg-white border border-neutral-300 shadow-xl p-2 rounded-sm flex flex-col justify-between overflow-hidden shrink-0">
                  <div className="relative w-full h-[85%] overflow-hidden bg-neutral-200">
                    <img
                      className="w-full h-full object-cover grayscale-[0.3]"
                      alt="Raw Passport Photo"
                      src={currentPreset.rawImg}
                    />
                    <div className="absolute top-1 left-1 font-metadata text-[8px] text-error bg-error-container/90 border border-error/30 px-1.5 py-0.5 rounded shadow-sm">
                      Raw (4.2MB)
                    </div>
                  </div>
                  <div className="h-[15%] flex flex-col justify-center items-center text-[8px] sm:text-[9px] font-label-bold text-carbon text-center border-t border-neutral-100 bg-neutral-50 leading-none py-1">
                    <div className="font-bold tracking-tight">ANKIT KUMAR</div>
                    <div className="text-[7px] text-secondary mt-0.5 font-semibold">PHOTO DATE: 14/06/2026</div>
                  </div>
                </div>
              )}
            </div>

            {/* After (Optimized Image/Result) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <div className="absolute inset-0 flex items-center justify-center p-4 bg-[#f0ede9]">
                {currentPreset.isPdf ? (
                  /* Rich PDF Certificate simulation: optimized high contrast version */
                  <div className="w-full h-full grid grid-cols-3 gap-2 p-2 sm:p-4 bg-[#f8f9fa] border border-carbon rounded shadow-inner">
                    {[1, 2, 3].map((page) => (
                      <div key={page} className="bg-white shadow-md border border-carbon rounded flex flex-col justify-between p-2 relative overflow-hidden select-none">
                        {/* Decorative Gold Certificate Border */}
                        <div className="absolute inset-1 border border-amber-600/40 rounded-sm pointer-events-none"></div>
                        <div className="absolute inset-1.5 border border-dashed border-amber-600/30 rounded-sm pointer-events-none"></div>
                        
                        <div className="z-10 flex flex-col items-center">
                          <span className="font-serif text-[6px] tracking-tighter text-amber-800 font-bold leading-none scale-90">CERTIFICATE</span>
                          <div className="w-3/4 h-[2px] bg-neutral-200 mt-1.5"></div>
                          <div className="w-1/2 h-[2px] bg-neutral-200 mt-0.5"></div>
                          <div className="w-[85%] h-[2px] bg-neutral-200 mt-1.5"></div>
                          <div className="w-2/3 h-[2px] bg-neutral-200 mt-0.5"></div>
                        </div>
                        
                        {/* Seal and Signature */}
                        <div className="z-10 flex justify-between items-end mt-2 px-1">
                          <div className="w-3 h-3 rounded-full bg-amber-400 border border-amber-600 flex items-center justify-center shadow-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 border border-amber-600/50"></div>
                          </div>
                          <div className="flex flex-col items-center">
                            <svg className="w-5 h-2 text-carbon" viewBox="0 0 20 8" fill="none" stroke="currentColor" strokeWidth="0.5">
                              <path d="M 2 6 Q 5 2 8 5 T 12 3 T 15 5 T 18 4" />
                            </svg>
                            <div className="w-6 h-[0.5px] bg-neutral-400"></div>
                          </div>
                        </div>

                        <div className="font-metadata text-[8px] text-right mt-2 text-primary select-none z-10">PAGE {page}</div>
                        <div className="absolute top-2 left-2 text-[6px] font-metadata text-primary font-bold bg-primary/10 px-1 border border-primary/20 rounded-sm z-10">
                          Optimized
                        </div>
                      </div>
                    ))}
                  </div>
                ) : currentPreset.isGrayscale ? (
                  /* Crisp white signature background */
                  <div className="relative w-full h-full flex items-center justify-center bg-white overflow-hidden border border-primary/20 p-8">
                    <div className="w-full max-w-[280px] select-none text-[#0f172a] flex flex-col items-center">
                      <svg viewBox="0 0 300 100" className="w-full h-auto" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                        <path d="M 30 50 C 45 40, 50 20, 60 30 C 70 45, 60 70, 75 65 C 90 60, 105 45, 115 48 C 125 50, 120 60, 130 58 C 145 55, 160 35, 175 40 C 190 45, 175 68, 195 62 C 215 55, 230 38, 250 42 C 270 45, 280 55, 290 50" />
                        <path d="M 50 75 Q 160 85 270 70" opacity="0.9" strokeWidth="2" />
                      </svg>
                    </div>
                    <div className="absolute top-2 left-2 font-metadata text-[9px] text-primary bg-primary-fixed-dim/20 border border-primary/30 px-2 py-0.5 rounded shadow-sm">
                      Crisp Ink & Pure White (14KB)
                    </div>
                  </div>
                ) : (
                  /* Optimized Portrait photo: Realistic UPSC passport photo card */
                  <div className="relative h-[90%] aspect-[3.5/4.5] bg-white border border-primary/20 shadow-xl p-2 rounded-sm flex flex-col justify-between overflow-hidden shrink-0">
                    <div className="relative w-full h-[85%] overflow-hidden bg-neutral-100">
                      <img
                        className="w-full h-full object-cover"
                        alt="Optimized Passport Photo"
                        src={currentPreset.compImg}
                      />
                      <div className="absolute top-1 left-1 font-metadata text-[8px] text-primary bg-primary-fixed-dim/30 border border-primary/30 px-1.5 py-0.5 rounded shadow-sm">
                        Optimized (45KB)
                      </div>
                    </div>
                    <div className="h-[15%] flex flex-col justify-center items-center text-[8px] sm:text-[9px] font-label-bold text-carbon text-center border-t border-neutral-100 bg-white leading-none py-1">
                      <div className="font-bold tracking-tight text-primary">ANKIT KUMAR</div>
                      <div className="text-[7px] text-secondary mt-0.5 font-semibold">PHOTO DATE: 14/06/2026</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Slider Drag Indicator Handle */}
            <div
              className="absolute top-0 bottom-0 z-10 w-[2px] bg-carbon cursor-col-resize focus:outline-none"
              style={{ left: `${sliderPos}%` }}
              onMouseDown={() => setIsResizing(true)}
              onTouchStart={() => setIsResizing(true)}
              role="slider"
              tabIndex={0}
              aria-valuenow={sliderPos}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Image comparison slider"
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") {
                  setSliderPos((prev) => Math.max(0, prev - 5));
                } else if (e.key === "ArrowRight") {
                  setSliderPos((prev) => Math.min(100, prev + 5));
                }
              }}
            >
              <div className="absolute top-1/2 left-1/2 w-10 h-10 bg-carbon text-white rounded-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2 select-none shadow-[0_0_15px_rgba(48,100,93,0.6)] hover:shadow-[0_0_25px_rgba(48,100,93,0.95)] hover:bg-primary transition-all active:scale-95 border border-white/20">
                <span className="material-symbols-outlined select-none pointer-events-none">unfold_more</span>
              </div>
            </div>

            {/* Size comparison labels */}
            <div className="absolute bottom-4 left-4 font-metadata text-[10px] text-white bg-carbon/70 px-2.5 py-1 uppercase rounded tracking-wider backdrop-blur-sm z-20">
              Original: {currentPreset.sourceSize}
            </div>
            <div className="absolute bottom-4 right-4 font-metadata text-[10px] text-white bg-primary/80 px-2.5 py-1 uppercase rounded tracking-wider backdrop-blur-sm z-20">
              Compressed: {currentPreset.compiledSize}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Generic Features Tab Section */}
      <section className="mb-12 bg-white border border-carbon rounded-lg p-6 md:p-8 shadow-xl">
        <div className="max-w-3xl mb-8">
          <h2 className="font-display-xl text-3xl sm:text-4xl text-carbon mb-4">
            Comprehensive Document & PDF Suite
          </h2>
          <p className="font-body-md text-sm sm:text-base text-on-surface-variant leading-relaxed">
            In addition to our strict government spec resizers, morpee provides a fully featured secure hybrid engine supporting all standard operations for complete documents management.
          </p>
        </div>

        {/* Tabs Bar */}
        <div className="flex flex-wrap gap-2 border-b border-carbon/10 pb-4 mb-6">
          {FEATURE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFeatureTab(tab.id)}
              className={`px-4 py-2 font-label-bold text-xs uppercase transition-all rounded-full ${
                activeFeatureTab === tab.id
                  ? "bg-carbon text-white shadow-sm"
                  : "text-secondary hover:bg-surface-container-high border border-transparent"
              }`}
            >
              {tab.title}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURE_TABS.find((t) => t.id === activeFeatureTab)?.features.map((feature, index) => (
            <div
              key={index}
              className="p-5 border border-carbon/10 bg-surface-container-lowest rounded hover:border-primary/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <h3 className="font-label-bold text-sm text-carbon mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  {feature.name}
                </h3>
                <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                  {feature.desc}
                </p>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* Govt Specifications Directory Table */}
      <section className="mb-12">
        <div className="max-w-3xl mb-8">
          <h2 className="font-display-xl text-3xl sm:text-4xl text-carbon mb-4">
            Portal Upload Standards & Reference
          </h2>
          <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
            Quickly check standard specifications before optimizing your photos, signatures, and certificates. Our workspace tools compile files directly to these guidelines.
          </p>
        </div>

        <div className="overflow-x-auto border border-carbon rounded-lg shadow-md bg-white">
          <table className="w-full text-left font-body-md border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-carbon text-white font-label-bold uppercase border-b border-carbon">
                <th className="p-4">Portal Name</th>
                <th className="p-4">Document Type</th>
                <th className="p-4">Required Dimensions</th>
                <th className="p-4">Target File Size</th>
                <th className="p-4">Workspace Link</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-carbon/10 hover:bg-surface-container-low transition-colors">
                <td className="p-4 font-semibold text-carbon">UPSC CSE / CDS</td>
                <td className="p-4 text-secondary">Passport Photograph</td>
                <td className="p-4 font-metadata">550 x 550 px (Min 350x350)</td>
                <td className="p-4 font-metadata">20 KB - 50 KB</td>
                <td className="p-4">
                  <Link href={getWorkspaceLink("image")} prefetch={false} className="text-primary hover:underline font-semibold font-metadata">
                    Resize Photo
                  </Link>
                </td>
              </tr>
              <tr className="border-b border-carbon/10 hover:bg-surface-container-low transition-colors">
                <td className="p-4 font-semibold text-carbon">UPSC CSE / CDS</td>
                <td className="p-4 text-secondary">Signature Scan</td>
                <td className="p-4 font-metadata">550 x 550 px (Min 350x350)</td>
                <td className="p-4 font-metadata">20 KB - 50 KB</td>
                <td className="p-4">
                  <Link href={getWorkspaceLink("image")} prefetch={false} className="text-primary hover:underline font-semibold font-metadata">
                    Resize Signature
                  </Link>
                </td>
              </tr>
              <tr className="border-b border-carbon/10 hover:bg-surface-container-low transition-colors">
                <td className="p-4 font-semibold text-carbon">SSC CGL / CHSL</td>
                <td className="p-4 text-secondary">Passport Photograph</td>
                <td className="p-4 font-metadata">3.5 cm x 4.5 cm (350x450 px)</td>
                <td className="p-4 font-metadata">20 KB - 50 KB</td>
                <td className="p-4">
                  <Link href={getWorkspaceLink("image")} prefetch={false} className="text-primary hover:underline font-semibold font-metadata">
                    Resize Photo
                  </Link>
                </td>
              </tr>
              <tr className="border-b border-carbon/10 hover:bg-surface-container-low transition-colors">
                <td className="p-4 font-semibold text-carbon">SSC CGL / CHSL</td>
                <td className="p-4 text-secondary">Signature Scan</td>
                <td className="p-4 font-metadata">6.0 cm x 2.0 cm (280x120 px)</td>
                <td className="p-4 font-metadata">10 KB - 20 KB</td>
                <td className="p-4">
                  <Link href={getWorkspaceLink("image")} prefetch={false} className="text-primary hover:underline font-semibold font-metadata">
                    Resize Signature
                  </Link>
                </td>
              </tr>
              <tr className="border-b border-carbon/10 hover:bg-surface-container-low transition-colors">
                <td className="p-4 font-semibold text-carbon">JEE / NEET (NTA)</td>
                <td className="p-4 text-secondary">Scanned Certificates (PDF)</td>
                <td className="p-4 font-metadata">A4 Standard Format</td>
                <td className="p-4 font-metadata">10 KB - 300 KB</td>
                <td className="p-4">
                  <Link href={getWorkspaceLink("pdf-compressor")} prefetch={false} className="text-primary hover:underline font-semibold font-metadata">
                    Compress PDF
                  </Link>
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="p-4 font-semibold text-carbon">All Government Portals</td>
                <td className="p-4 text-secondary">Caste, PwD, Income Certificates</td>
                <td className="p-4 font-metadata">Standard Portrait / Landscape</td>
                <td className="p-4 font-metadata">Under 500 KB (Usually)</td>
                <td className="p-4">
                  <Link href={getWorkspaceLink("pdf-compressor")} prefetch={false} className="text-primary hover:underline font-semibold font-metadata">
                    Compress PDF
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) Section - AEO/GEO/SEO Optimized */}
      <section className="bg-surface-container-low border border-carbon/25 rounded-lg p-6 md:p-8 shadow-inner">
        <h2 className="font-display-xl text-3xl sm:text-4xl text-carbon mb-6 text-center">
          Frequently Asked Questions
        </h2>
        <div className="max-w-4xl mx-auto space-y-3">
          {[
            {
              q: "How do I compress and resize documents on morpee?",
              a: "Navigate to the Image Optimizer for photo/signature resizing or the PDF Compressor for certificate files. Select a government preset (like UPSC or SSC), choose your file, adjust settings, and download your optimized, compliant file instantly."
            },
            {
              q: "Are my Aadhaar, PAN card, and certificates safe on this website?",
              a: "Yes. Document processing runs inside your browser's memory. While metadata, verification logging, and payment sync are managed securely via our server stack, your sensitive original files are processed locally."
            },
            {
              q: "Why does the UPSC portal reject compressed photos?",
              a: "Portals reject uploads if they do not match exact pixel aspect ratios or have blurred edges. Morpee applies intelligent canvas aspect anchoring and vector contrast enhancements to ensure uploads comply perfectly with portal requirements."
            },
            {
              q: "How can I merge multiple document scans into one PDF under 500KB?",
              a: "Use our PDF Compressor workspace node to combine multiple JPG scans or smaller PDF pages, rotate pages to correct alignments, and run local stream compression to pack the file safely under the standard 500KB government portal limit."
            }
          ].map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className="border border-carbon/10 rounded-md bg-white overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full text-left p-4 font-label-bold text-xs md:text-sm text-carbon uppercase flex justify-between items-center hover:bg-surface-container-high transition-colors focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <span className="material-symbols-outlined transition-transform duration-200">
                    {isOpen ? "remove" : "add"}
                  </span>
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-[200px] border-t border-carbon/10 p-4" : "max-h-0 overflow-hidden"
                  }`}
                >
                  <p className="font-body-md text-xs md:text-sm text-on-surface-variant leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Business Compliance Footer */}
      <footer className="mt-16 border-t border-carbon/10 pt-8 pb-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-center md:text-left text-secondary font-metadata text-xs uppercase">
        <div>
          <div className="font-bold text-carbon mb-2">MORPEE Document Engine</div>
          <p className="lowercase font-body-md text-[11px] leading-relaxed max-w-sm">
            secure hybrid passport photo, signature, and PDF compressor for government portal registration forms.
          </p>
        </div>
        <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2">
          <Link href="/terms" className="hover:text-carbon transition-colors">Terms & Conditions</Link>
          <Link href="/privacy" className="hover:text-carbon transition-colors">Privacy Policy</Link>
          <Link href="/refund" className="hover:text-carbon transition-colors">Refund Policy</Link>
          <Link href="/contact" className="hover:text-carbon transition-colors">Contact Us</Link>
        </div>
      </footer>

      {/* Comic Story Modal Overlay */}
      {storyOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-carbon/80 backdrop-blur-sm select-none">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-[#fdfaf5] border-4 border-carbon p-6 md:p-8 relative shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-y-auto max-h-[90vh] rounded-md"
          >
            {/* Comic Balloon Header */}
            <div className="flex justify-between items-center border-b-4 border-carbon pb-4 mb-6">
              <h2 className="font-display-xl text-2xl uppercase tracking-widest text-carbon font-bold">
                ⚡ The Origin of Morpee ⚡
              </h2>
              <button
                onClick={() => setStoryOpen(false)}
                className="w-10 h-10 border-2 border-carbon rounded-full flex items-center justify-center hover:bg-error hover:text-white transition-colors cursor-pointer font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]"
                aria-label="Close story modal"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Comic Image Strip */}
            <div className="border-4 border-carbon bg-white p-2 rounded mb-6 shadow-inner">
              <img
                src="/morpee_story.png"
                alt="Morpee Brand Story Manga strip"
                className="w-full h-auto object-contain border border-carbon/25"
              />
            </div>

            {/* Panel Narration Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-body-md text-xs text-carbon">
              {/* Panel 1 */}
              <div className="border-2 border-carbon p-5 relative bg-white rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
                <div className="absolute -top-3 left-4 bg-carbon text-white font-label-bold uppercase px-2 py-0.5 text-[8px] tracking-widest font-bold">
                  Panel 1: The Sterile Past
                </div>
                <p className="mt-2 leading-relaxed">
                  Our system started as <strong>COLO</strong>. Power-packed, yes, but the name felt like cold, industrial server colocation storage. It lacked soul.
                </p>
              </div>

              {/* Panel 2 */}
              <div className="border-2 border-carbon p-5 relative bg-white rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
                <div className="absolute -top-3 left-4 bg-[#05c46b] text-white font-label-bold uppercase px-2 py-0.5 text-[8px] tracking-widest font-bold border border-carbon">
                  Panel 2: Shift to Morph
                </div>
                <p className="mt-2 leading-relaxed">
                  Inspired by shape-shifting tech, the engine <strong>"Morphs"</strong> massive photos and certificates into precise portal constraints in your browser memory.
                </p>
              </div>

              {/* Panel 3 */}
              <div className="border-2 border-carbon p-5 relative bg-white rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
                <div className="absolute -top-3 left-4 bg-[#ffa801] text-white font-label-bold uppercase px-2 py-0.5 text-[8px] tracking-widest font-bold border border-carbon">
                  Panel 3: The Rupee Suffix
                </div>
                <p className="mt-2 leading-relaxed">
                  With the double "ee" ending of the <strong>Rupee</strong>, morpee builds instant phonetic trust with Indian students who save money on registrations.
                </p>
              </div>
            </div>
            
            {/* Modal Footer Caption */}
            <div className="mt-6 text-center border-t-2 border-dashed border-carbon/25 pt-4">
              <span className="font-metadata text-[10px] text-secondary uppercase tracking-widest font-bold">
                morpee.me // active shape-shifting document engine
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

