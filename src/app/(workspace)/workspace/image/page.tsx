"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { compressImageToTargetSize, CompressionResult, loadImage, drawImageToCanvas } from "@/utils/imageCompressor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { ToolLayout } from "@/components/ui/ToolLayout";

interface ExamPreset {
  name: string;
  width: number;
  height: number;
  minKb: number;
  maxKb: number;
  ratioText: string;
}

const PRESETS: Record<string, ExamPreset> = {
  "ssc-photo": {
    name: "SSC CGL 2026 Photograph Spec",
    width: 350,
    height: 450,
    minKb: 20,
    maxKb: 50,
    ratioText: "7:9",
  },
  "ssc-signature": {
    name: "SSC CGL 2026 Signature Spec",
    width: 280,
    height: 120,
    minKb: 10,
    maxKb: 20,
    ratioText: "7:3",
  },
  "upsc-photo": {
    name: "UPSC CSE 2026 Photograph Spec",
    width: 550,
    height: 550,
    minKb: 20,
    maxKb: 300,
    ratioText: "1:1",
  },
  "upsc-signature": {
    name: "UPSC CSE 2026 Signature Spec",
    width: 350,
    height: 350,
    minKb: 20,
    maxKb: 300,
    ratioText: "1:1",
  },
  "passport-standard": {
    name: "Passport Standard 2024",
    width: 350,
    height: 450,
    minKb: 10,
    maxKb: 100,
    ratioText: "7:9",
  },
  "custom": {
    name: "Custom Specifications",
    width: 400,
    height: 400,
    minKb: 10,
    maxKb: 100,
    ratioText: "Custom",
  },
};

type StepType = "upload" | "preset" | "preview" | "output";

export default function ImageWorkspace() {
  const [currentStep, setCurrentStep] = useState<StepType>("upload");

  const [activePresetKey, setActivePresetKey] = useState("ssc-photo");
  const [width, setWidth] = useState(PRESETS["ssc-photo"].width);
  const [height, setHeight] = useState(PRESETS["ssc-photo"].height);
  const [targetKb, setTargetKb] = useState(45);
  const [mode, setMode] = useState<"fit" | "crop">("crop");
  const [subsampling, setSubsampling] = useState<"4:2:0" | "4:4:4">("4:2:0");

  const [rawFile, setRawFile] = useState<File | null>(null);
  const [rawUrl, setRawUrl] = useState<string | null>(null);
  const [rawPreviewUrl, setRawPreviewUrl] = useState<string | null>(null);
  const rawPreviewUrlRef = useRef<string | null>(null);
  const [rawSizeKb, setRawSizeKb] = useState(0);

  const [compResult, setCompResult] = useState<CompressionResult | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Live Preview Ready");

  const [sliderPos, setSliderPos] = useState(50);
  const splitRef = useRef<HTMLDivElement>(null);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);

  // Sync preset changes
  const selectPreset = (key: string) => {
    setActivePresetKey(key);
    const preset = PRESETS[key];
    setWidth(preset.width);
    setHeight(preset.height);
    setTargetKb(Math.round((preset.minKb + preset.maxKb) / 2));
    
    // Automatically switch mode based on preset (signatures need fitting, photos cropping)
    if (key.includes("signature")) {
      setMode("fit");
    } else {
      setMode("crop");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 25 * 1024 * 1024) {
        alert("FILE SIZE LIMIT: The selected file exceeds 25MB. Please upload a smaller image file for client-side stability.");
        return;
      }
      
      // Clean up previous URLs
      if (rawUrl) {
        URL.revokeObjectURL(rawUrl);
      }
      if (rawPreviewUrlRef.current) {
        URL.revokeObjectURL(rawPreviewUrlRef.current);
        rawPreviewUrlRef.current = null;
      }

      setRawFile(file);
      setRawSizeKb(file.size / 1024);
      
      const newUrl = URL.createObjectURL(file);
      setRawUrl(newUrl);
      setRawPreviewUrl(null);
      setCompResult(null);
      setCurrentStep("preset"); // Auto transition to preset step on mobile

      // Auto-detect profile & settings based on filename and aspect ratio
      const nameLower = file.name.toLowerCase();
      const isSignatureByName = nameLower.includes("sig") || nameLower.includes("sign") || nameLower.includes("signature");

      loadImage(file)
        .then(img => {
          const ratio = img.width / img.height;
          let detectedPreset = activePresetKey;
          let detectedMode = mode;

          if (isSignatureByName || ratio > 1.3) {
            // It's a horizontal/wide signature scan
            if (activePresetKey === "ssc-photo") {
              detectedPreset = "ssc-signature";
            } else if (activePresetKey === "upsc-photo") {
              detectedPreset = "upsc-signature";
            } else if (activePresetKey !== "ssc-signature" && activePresetKey !== "upsc-signature") {
              detectedPreset = "ssc-signature";
            }
            detectedMode = "fit"; // default to padding borders for wide signatures
          } else if (ratio < 0.9 && (activePresetKey === "ssc-signature" || activePresetKey === "upsc-signature")) {
            // It's a vertical portrait photo uploaded to a signature slot
            if (activePresetKey === "ssc-signature") {
              detectedPreset = "ssc-photo";
            } else if (activePresetKey === "upsc-signature") {
              detectedPreset = "upsc-photo";
            }
            detectedMode = "crop";
          }

          if (detectedPreset !== activePresetKey) {
            setActivePresetKey(detectedPreset);
            const preset = PRESETS[detectedPreset];
            setWidth(preset.width);
            setHeight(preset.height);
            setTargetKb(Math.round((preset.minKb + preset.maxKb) / 2));
          }
          setMode(detectedMode);
        })
        .catch(err => {
          console.error("Failed to load image for auto-detect", err);
        });
    }
  };

  const runCompiler = useCallback(async () => {
    if (!rawFile) return;
    setIsCompiling(true);
    setStatusMessage("Optimizing image...");

    const preset = PRESETS[activePresetKey];
    const bufferRange = 5; // offset buffer
    const minKb = activePresetKey === "custom" ? Math.max(1, targetKb - bufferRange) : preset.minKb;
    const maxKb = activePresetKey === "custom" ? targetKb + bufferRange : preset.maxKb;

    try {
      const img = await loadImage(rawFile);
      
      // Generate uncompressed high-quality preview at target dimensions/mode using blob URL to avoid large Base64 state memory overhead
      const previewCanvas = drawImageToCanvas(img, width, height, mode);
      const previewBlob = await new Promise<Blob>((resolve, reject) => {
        previewCanvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error("PREVIEW_BLOB_CREATION_FAILED"));
          },
          "image/png"
        );
      });

      if (rawPreviewUrlRef.current) {
        URL.revokeObjectURL(rawPreviewUrlRef.current);
      }
      const previewUrl = URL.createObjectURL(previewBlob);
      rawPreviewUrlRef.current = previewUrl;
      setRawPreviewUrl(previewUrl);

      const result = await compressImageToTargetSize(rawFile, {
        targetWidth: width,
        targetHeight: height,
        minKb,
        maxKb,
        mode,
        chromaSubsampling: subsampling,
      });
      setCompResult(result);
      setStatusMessage("Optimization complete");
      
      // Auto focus preview step on mobile to show the output image comparison
      setCurrentStep("preview");
    } catch (err) {
      console.error(err);
      setStatusMessage("Optimization failed");
    } finally {
      setIsCompiling(false);
    }
  }, [rawFile, activePresetKey, targetKb, width, height, mode, subsampling]);

  useEffect(() => {
    if (rawFile) {
      const timer = setTimeout(() => {
        runCompiler();
      }, 150); // Small debounce to aggregate rapid state adjustments
      return () => clearTimeout(timer);
    }
  }, [rawFile, runCompiler]);

  useEffect(() => {
    return () => {
      if (rawUrl) {
        URL.revokeObjectURL(rawUrl);
      }
      if (rawPreviewUrlRef.current) {
        URL.revokeObjectURL(rawPreviewUrlRef.current);
      }
    };
  }, [rawUrl]);

  const handleSliderMove = (clientX: number) => {
    if (!splitRef.current) return;
    const rect = splitRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handleSliderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setSliderPos(prev => Math.max(0, prev - 5));
    } else if (e.key === "ArrowRight") {
      setSliderPos(prev => Math.min(100, prev + 5));
    } else if (e.key === "Home") {
      setSliderPos(0);
    } else if (e.key === "End") {
      setSliderPos(100);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDraggingSlider(false);
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const activePreset = PRESETS[activePresetKey];
  const isCustom = activePresetKey === "custom";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Mobile Step navigation (Toggled for screens below md) */}
      <nav className="md:hidden flex border-b border-carbon bg-white sticky top-16 z-30 font-metadata text-[11px] select-none">
        {(["upload", "preset", "preview", "output"] as const).map(step => {
          const isActive = currentStep === step;
          const isDisabled = step !== "upload" && !rawFile;
          const isDone = step === "upload" ? !!rawFile : step === "preset" ? !!rawFile : step === "preview" ? !!compResult : !!compResult;
          return (
            <button
              key={step}
              type="button"
              disabled={isDisabled}
              onClick={() => setCurrentStep(step)}
              className={`flex-grow py-4 text-center border-r border-carbon font-label-bold uppercase transition-all min-h-[44px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isActive ? "bg-carbon text-white" : "bg-white text-carbon hover:bg-surface-container-high"
              }`}
            >
              {step} {isDone && "✓"}
            </button>
          );
        })}
      </nav>

      <ToolLayout
        className={compResult ? "pb-[160px] md:pb-[80px]" : "pb-[80px]"}
        sidebar={
          <div className={currentStep === "preset" ? "block" : "hidden md:block"}>
            <section>
              <h2 className="font-label-bold text-label-bold text-carbon border-b border-carbon pb-2 mb-6 uppercase">
                Resize Options
              </h2>
              <div className="space-y-6">
                {/* Preset Dropdown */}
                <Select
                  id="active-preset"
                  label="Active Preset"
                  value={activePresetKey}
                  onChange={e => selectPreset(e.target.value)}
                  options={Object.entries(PRESETS).map(([key, p]) => ({
                    value: key,
                    label: p.name,
                  }))}
                />

                {/* Spec readout card */}
                <div className="bg-carbon text-surface-bright p-4 font-metadata text-[11px] leading-relaxed tracking-wider">
                  <div className="flex justify-between border-b border-surface-variant/20 pb-1 mb-1">
                    <span>Target Dimensions</span>
                    <span>
                      {isCustom ? "Custom dimensions" : `${activePreset.width}x${activePreset.height} px`}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-surface-variant/20 pb-1 mb-1">
                    <span>File Size Target</span>
                    <span>
                      {isCustom ? "Custom target size" : `MIN: ${activePreset.minKb}KB // MAX: ${activePreset.maxKb}KB`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Output Format</span>
                    <span>JPG</span>
                  </div>
                </div>

                {/* Params inputs */}
                <div className="space-y-6 pt-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="width-input" className="font-metadata text-[10px] min-[360px]:text-metadata text-secondary uppercase flex justify-between gap-1 flex-wrap">
                      Target Resolution <span>{isCustom ? "(Editable)" : "(Locked)"}</span>
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="width-input"
                        value={width}
                        onChange={e => setWidth(Math.max(1, parseInt(e.target.value) || 0))}
                        disabled={!isCustom}
                        textCenter
                        variant="highest"
                        type="number"
                      />
                      <span className="flex items-center">x</span>
                      <Input
                        id="height-input"
                        value={height}
                        onChange={e => setHeight(Math.max(1, parseInt(e.target.value) || 0))}
                        disabled={!isCustom}
                        textCenter
                        variant="highest"
                        type="number"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border border-carbon p-3.5 bg-white min-h-[44px]">
                    <span className="font-metadata text-[10px] min-[360px]:text-metadata uppercase">Aspect Ratio Lock</span>
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                      <span className="font-metadata text-[10px] min-[360px]:text-metadata">
                        {isCustom ? "(Auto)" : `(Locked: ${activePreset.ratioText})`}
                      </span>
                    </div>
                  </div>

                  <Input
                    id="target-size"
                    label={`Target Size Limit (${isCustom ? "KB" : "Preset Target"})`}
                    value={targetKb}
                    onChange={e => setTargetKb(Math.max(5, parseInt(e.target.value) || 0))}
                    disabled={!isCustom}
                    type="number"
                  />

                  <div className="flex flex-col gap-2">
                    <label className="font-metadata text-[10px] min-[360px]:text-metadata text-secondary uppercase">Resize Engine Mode</label>
                    <div className="grid grid-cols-2 border border-carbon">
                      <Button
                        variant={mode === "crop" ? "toggle-active" : "toggle-inactive"}
                        rounded={false}
                        onClick={() => setMode("crop")}
                        className="min-h-[44px] py-3.5"
                      >
                        Crop to Aspect Ratio
                      </Button>
                      <Button
                        variant={mode === "fit" ? "toggle-active" : "toggle-inactive"}
                        rounded={false}
                        onClick={() => setMode("fit")}
                        className="min-h-[44px] py-3.5"
                      >
                        Add Borders (Padding)
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-metadata text-[10px] min-[360px]:text-metadata text-secondary uppercase">Chroma Subsampling</label>
                    <div className="grid grid-cols-2 border border-carbon">
                      <Button
                        variant={subsampling === "4:2:0" ? "toggle-active" : "toggle-inactive"}
                        rounded={false}
                        onClick={() => setSubsampling("4:2:0")}
                        className="min-h-[44px] py-3.5"
                      >
                        High Compression
                      </Button>
                      <Button
                        variant={subsampling === "4:4:4" ? "toggle-active" : "toggle-inactive"}
                        rounded={false}
                        onClick={() => setSubsampling("4:4:4")}
                        className="min-h-[44px] py-3.5"
                      >
                        High Quality (Detail)
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-auto pt-8">
              <Button
                variant="carbon"
                size="lg"
                onClick={runCompiler}
                disabled={isCompiling || !rawFile}
                className="w-full tracking-widest group min-h-[50px]"
              >
                <span>{isCompiling ? "Optimizing image..." : "Compress & Resize Photo"}</span>
                <span className={`material-symbols-outlined ${isCompiling ? "animate-spin" : "group-hover:rotate-180"} transition-transform`}>
                  settings_backup_restore
                </span>
              </Button>
            </div>
          </div>
        }
      >
        {/* Upload drop zone - visible on desktop if no file, or on mobile if step is upload */}
        <div className={!rawUrl ? "flex-grow flex flex-col h-full" : (currentStep === "upload" ? "flex-grow flex flex-col h-full md:hidden" : "hidden")}>
          <FileDropzone
            onFileChange={handleFileChange}
            accept="image/*"
            label="Drop your photo or signature here"
            subtext="Supports JPG, PNG, WEBP (Up to 15MB)"
            className="h-full"
          />
        </div>

        {/* Preview / Sliding compare - visible on desktop if rawUrl, or on mobile if step is preview */}
        {rawUrl && (
          <div className={`${currentStep === "preview" ? "flex-grow flex flex-col h-[450px] md:h-full" : "hidden md:flex md:flex-col md:flex-grow md:h-full"} bg-white/40 relative overflow-hidden`}>
            {/* Top Info Bar */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <StatusBadge
                variant="carbon"
                text={statusMessage}
                animate
              />
              <div className="bg-surface-container-high border border-carbon px-3 py-1 font-metadata text-[10px] uppercase">
                ZOOM: 100%
              </div>
            </div>

            <div
              ref={splitRef}
              onMouseMove={e => isDraggingSlider && handleSliderMove(e.clientX)}
              onTouchMove={e => isDraggingSlider && e.touches[0] && handleSliderMove(e.touches[0].clientX)}
              className="flex-grow relative select-none bg-surface-container-low overflow-hidden min-h-[350px] md:min-h-0"
            >
              {/* Left Side: Original Image */}
              <div 
                className="absolute inset-0 bg-surface-container-low flex items-center justify-center overflow-hidden p-6"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <img
                  src={rawPreviewUrl || rawUrl || ""}
                  alt="Original Scan"
                  className="max-h-[90%] max-w-[90%] object-contain shadow-2xl pointer-events-none"
                  draggable="false"
                />
                <div className="absolute bottom-4 left-4 font-metadata text-metadata bg-white/80 px-2 py-1 uppercase border border-carbon z-20">
                  Original: {rawFile?.name.substring(0, 15)}... ({rawSizeKb.toFixed(1)} KB)
                </div>
              </div>

              {/* Right Side: Optimized preview */}
              <div
                className="absolute inset-0 bg-white flex items-center justify-center overflow-hidden p-6"
                style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
              >
                {compResult ? (
                  <img
                    src={compResult.url}
                    alt="Optimized Preview"
                    className="max-h-[90%] max-w-[90%] object-contain shadow-2xl pointer-events-none"
                    draggable="false"
                  />
                ) : (
                  <div className="text-center text-outline-variant font-metadata uppercase p-4">
                    Ready to Compress
                  </div>
                )}
                {compResult && (
                  <div className="absolute bottom-4 right-4 font-metadata text-metadata bg-carbon text-white px-2 py-1 uppercase border border-carbon z-20">
                    Compressed: {compResult.sizeKb.toFixed(1)} KB
                  </div>
                )}
              </div>

              {/* Slider boundary handle */}
              <div
                className="absolute top-0 bottom-0 z-30 w-px bg-carbon"
                style={{ left: `${sliderPos}%` }}
              >
                <div
                  role="slider"
                  aria-label="Image comparison slider"
                  aria-valuenow={Math.round(sliderPos)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  tabIndex={0}
                  onKeyDown={handleSliderKeyDown}
                  onMouseDown={() => setIsDraggingSlider(true)}
                  onTouchStart={() => setIsDraggingSlider(true)}
                   className="absolute top-1/2 left-1/2 w-11 h-11 bg-carbon rounded-full flex items-center justify-center text-white cursor-col-resize shadow-[0_0_15px_rgba(48,100,93,0.6)] hover:shadow-[0_0_25px_rgba(48,100,93,0.95)] hover:bg-primary transition-all -translate-x-1/2 -translate-y-1/2 z-30 select-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <span className="material-symbols-outlined text-[20px]">unfold_more</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Output details */}
        <div className={`${currentStep === "output" ? "block" : "hidden"} md:hidden p-6 space-y-6 bg-white border-t border-carbon`}>
          <h3 className="font-label-bold text-label-bold uppercase border-b border-carbon pb-2 mb-4">Optimization Output</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-carbon p-4 flex flex-col justify-center">
              <span className="font-metadata text-[10px] text-secondary block mb-1">File Size</span>
              <span className="font-label-bold text-lg">{compResult ? `${compResult.sizeKb.toFixed(1)} KB` : "N/A"}</span>
              {compResult && <StatusBadge variant="pill-success" text="COMPLIANT" className="mt-1" />}
            </div>
            <div className="border border-carbon p-4 flex flex-col justify-center">
              <span className="font-metadata text-[10px] text-secondary block mb-1">Dimensions</span>
              <span className="font-label-bold text-lg">{compResult ? `${compResult.width}x${compResult.height} PX` : "N/A"}</span>
              {compResult && <StatusBadge variant="pill-success" text="COMPLIANT" className="mt-1" />}
            </div>
            <div className="border border-carbon p-4 col-span-2 flex flex-col justify-center">
              <span className="font-metadata text-[10px] text-secondary block mb-1">Pixel Aspect Ratio</span>
              <span className="font-label-bold text-lg">{compResult ? "1.000" : "N/A"}</span>
              {compResult && <StatusBadge variant="pill-success" text="COMPLIANT" className="mt-1" />}
            </div>
          </div>
        </div>

        {/* Desktop Bottom Telemetry Output Bar */}
        <div className="hidden md:flex h-24 bg-surface-container-highest border-t border-carbon divide-x divide-carbon select-none">
          <MetricCard
            label="File Size"
            value={compResult ? `${compResult.sizeKb.toFixed(1)} KB` : "N/A"}
            compliant={!!compResult}
          />
          <MetricCard
            label="Dimensions"
            value={compResult ? `${compResult.width}x${compResult.height} PX` : "N/A"}
            compliant={!!compResult}
          />
          <MetricCard
            label="Pixel Aspect Ratio"
            value={compResult ? "1.000" : "N/A"}
            compliant={!!compResult}
          />
          <div className="w-64 p-4 flex items-center justify-center">
            {compResult ? (
              <a
                href={compResult.url}
                download={`optimized_${rawFile?.name.split(".")[0]}.jpg`}
                className="w-full h-full block"
              >
                <Button
                  variant="outline"
                  size="full"
                  className="h-full hover:bg-muted-teal text-xs md:text-metadata font-metadata group min-h-[44px]"
                >
                  Download Optimized JPG
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-y-1 transition-transform">
                    download
                  </span>
                </Button>
              </a>
            ) : (
              <Button
                disabled
                variant="outline"
                size="full"
                className="border-outline-variant text-outline-variant font-metadata cursor-not-allowed min-h-[44px]"
              >
                Awaiting Compression
              </Button>
            )}
          </div>
        </div>
      </ToolLayout>

      {/* Sticky Mobile Download CTA - visible only on mobile, when compResult exists */}
      {compResult && (
        <div className="md:hidden fixed bottom-[50px] left-0 w-full z-40 bg-white border-t border-carbon p-4 select-none">
          <a
            href={compResult.url}
            download={`optimized_${rawFile?.name.split(".")[0]}.jpg`}
            className="w-full block"
          >
            <Button
              variant="secondary"
              size="full"
              className="h-12 text-[11px] font-metadata group min-h-[44px]"
            >
              Download Optimized JPG
              <span className="material-symbols-outlined text-[18px] group-hover:translate-y-1 transition-transform">
                download
              </span>
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
