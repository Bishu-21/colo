"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

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
    <main className="max-w-[1440px] mx-auto px-container-padding pt-16 pb-32">
      {/* Hero Section */}
      <div className="grid-container mb-24">
        <div className="col-span-12 md:col-span-10 lg:col-span-8">
          <h1 className="font-display-xl text-5xl md:text-8xl italic leading-tight text-carbon mb-8">
            Stop guessing quality. <span className="block">Compile your documents to exact government specifications.</span>
          </h1>
          <p className="font-body-md text-body-md max-w-2xl text-on-surface-variant leading-relaxed mb-12">
            Zero-Trust local compression. Your sensitive government IDs, signatures, and photos never leave your device. Processed client-side in WebAssembly.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/workspace/image">
              <button className="px-8 py-4 bg-carbon text-surface-bright rounded-full font-label-bold text-label-bold uppercase transition-all neo-button-hover cursor-crosshair">
                [LAUNCH_WORKSPACE_NODE]
              </button>
            </Link>
            <Link href="/support">
              <button className="px-8 py-4 border border-carbon rounded-full font-label-bold text-label-bold uppercase hover:bg-surface-container-high transition-all">
                [VIEW_EXAM_TEMPLATES]
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Demo Pod */}
      <section className="col-span-12 structural-border bg-white mb-24 crosshair-cursor overflow-hidden flex flex-col md:flex-row h-auto md:h-[600px]">
        {/* Left Controls */}
        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-carbon p-8 bg-surface-container-lowest flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <span className="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
              <span className="font-metadata text-metadata uppercase">System Status: Demo Sandbox</span>
            </div>
            <label className="block font-label-bold text-label-bold uppercase mb-4 text-secondary">Interactive Templates</label>
            <div className="space-y-2 mb-8">
              <div className="p-4 bg-carbon text-white font-body-md flex justify-between items-center">
                UPSC Photo Spec (550x550px)
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </div>
              <Link href="/workspace/image" className="block p-4 border border-outline-variant text-secondary font-body-md hover:bg-surface-container-high transition-colors">
                SSC Signature (JPEG, &lt; 20KB)
              </Link>
              <Link href="/workspace/pdf" className="block p-4 border border-outline-variant text-secondary font-body-md hover:bg-surface-container-high transition-colors">
                Combined PDF Certificate (&lt; 500KB)
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between font-metadata text-metadata mb-2">
                <span>QUALITY_THRESHOLD</span>
                <span>88%</span>
              </div>
              <div className="h-[2px] bg-outline-variant w-full relative">
                <div className="absolute h-full bg-primary w-[88%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between font-metadata text-metadata mb-2">
                <span>EDGE_PRESERVATION</span>
                <span>ACTIVE</span>
              </div>
              <div className="h-[2px] bg-outline-variant w-full relative">
                <div className="absolute h-full bg-primary w-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Slider */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="w-full md:w-2/3 relative select-none bg-surface-dim overflow-hidden flex items-center justify-center p-8 md:p-12 h-[350px] md:h-full"
        >
          <div className="absolute top-6 right-6 z-20">
            <span className="bg-primary text-on-primary px-3 py-1 font-metadata text-metadata uppercase tracking-widest">
              [TELEMETRY: COMPLIANT // 45.2 KB]
            </span>
          </div>

          <div className="relative w-full h-full border border-carbon/20 overflow-hidden shadow-xl">
            {/* Before (Source Image) */}
            <div className="absolute inset-0 grayscale-[0.5]">
              <img
                className="w-full h-full object-cover"
                alt="Source Image"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLqzu0WAhJfEkFXhMQdN_TTMoylte7zj_mJgRZzW2qPvCWT5LvwFgAl9dv-Xl6syBiyqNTq4ndwT0z79HFe_FmjJNOE0B_s7Lx8YCkrjMoXyNQv_2dNrH-269VCHx_qATv-5I8Hl2X2T1KDzK6-m6kiqkbkOh0Op8CZWjCZBiG0atUt22J2vDWNQzW56lHZ7YJ3Q1WhcWTm2fZtJkzCyNQgSJQsnKrBcOZ7cB9-INL68PysyRFhEmPXE_L8mFKqs4D5He7eAfVFhg"
              />
            </div>

            {/* After (Optimized Image) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <img
                className="w-full h-[100%] object-cover blur-[0.5px]"
                alt="Optimized Image"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnYqEhZDkDUKMg30jrDHjoDJH9hG5jJeGzWPe6JI0lvNsljZZaJ3bZiJ4BfSuMxTE8ehLXGz98Gbrszg810SwHo6iP1kh0oCu1AtgxjDo50Gs0q6GkhgOnA7iPsIneK2XAb1mUE7m77U7Ib7pkW5V2hj7FHDNaVx8NITBfpWWq8oJ43Mh139xBHnPsxVntE__SNqjHrQVCHo2iK84_eofVBUxYIOWpqoyIwEd-WKH3SfuRcGjSqPHnH0wx-rhrGUAfR_kAFgUohTI"
              />
            </div>

            {/* Slider Handle */}
            <div
              className="absolute top-0 bottom-0 z-10 w-[2px] bg-carbon"
              style={{ left: `${sliderPos}%` }}
              onMouseDown={() => setIsResizing(true)}
              onTouchStart={() => setIsResizing(true)}
            >
              <div className="absolute top-1/2 left-1/2 w-10 h-10 bg-carbon text-white rounded-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-col-resize select-none">
                <span className="material-symbols-outlined">unfold_more</span>
              </div>
            </div>

            {/* Labels */}
            <div className="absolute bottom-4 left-4 font-metadata text-metadata text-white bg-carbon/50 px-2 py-1 uppercase">Source: 4.2MB</div>
            <div className="absolute bottom-4 right-4 font-metadata text-metadata text-white bg-primary/50 px-2 py-1 uppercase">Compiled: 45KB</div>
          </div>
        </div>
      </section>

      {/* Pain Points Grid */}
      <div className="grid-container border-t border-l border-carbon">
        {/* Point 1 */}
        <div className="col-span-12 md:col-span-4 structural-border -ml-[1px] -mt-[1px] p-8 flex flex-col justify-between hover:bg-carbon hover:text-white transition-all group">
          <div>
            <header className="font-label-bold text-label-bold uppercase text-primary mb-6 group-hover:text-primary-fixed-dim">[PAIN: BLURRED SIGNATURES]</header>
            <p className="font-body-md leading-relaxed text-secondary group-hover:text-surface-variant">
              Aggressive algorithms pixelate ink details, causing manual verification rejection. Most compressors destroy the fine contrast needed for OCR systems to read your name.
            </p>
          </div>
          <footer className="mt-12 font-metadata text-metadata uppercase opacity-60">
            [FIX: VECTOR EDGE PROTECTION]
          </footer>
        </div>
        {/* Point 2 */}
        <div className="col-span-12 md:col-span-4 structural-border -ml-[1px] -mt-[1px] p-8 flex flex-col justify-between hover:bg-carbon hover:text-white transition-all group">
          <div>
            <header className="font-label-bold text-label-bold uppercase text-primary mb-6 group-hover:text-primary-fixed-dim">[PAIN: EXACT ASPECT RATIOS]</header>
            <p className="font-body-md leading-relaxed text-secondary group-hover:text-surface-variant">
              Portals hard-reject resized files if width/height are off by even a single pixel. We enforce rigid canvas anchors to ensure compliance every time.
            </p>
          </div>
          <footer className="mt-12 font-metadata text-metadata uppercase opacity-60">
            [FIX: CANVAS ANCHOR PADDING]
          </footer>
        </div>
        {/* Point 3 */}
        <div className="col-span-12 md:col-span-4 structural-border -ml-[1px] -mt-[1px] p-8 flex flex-col justify-between hover:bg-carbon hover:text-white transition-all group">
          <div>
            <header className="font-label-bold text-label-bold uppercase text-primary mb-6 group-hover:text-primary-fixed-dim">[PAIN: PRIVACY RISK]</header>
            <p className="font-body-md leading-relaxed text-secondary group-hover:text-surface-variant">
              Uploading Aadhaar and PAN cards to free servers risks identity theft. Our engine runs entirely in your browser's RAM, leaving no trace on our servers.
            </p>
          </div>
          <footer className="mt-12 font-metadata text-metadata uppercase opacity-60">
            [FIX: 100% OFFLINE WASM RUNTIME]
          </footer>
        </div>
      </div>
    </main>
  );
}
