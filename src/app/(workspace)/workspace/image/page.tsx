"use client";

import React, { useState, useRef, useEffect } from "react";
import { compressImageToTargetSize, CompressionResult, loadImage, drawImageToCanvas } from "@/utils/imageCompressor";

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
    name: "Custom_Override",
    width: 400,
    height: 400,
    minKb: 10,
    maxKb: 100,
    ratioText: "Custom",
  },
};

export default function ImageWorkspace() {
  const [activePresetKey, setActivePresetKey] = useState("ssc-photo");
  const [width, setWidth] = useState(PRESETS["ssc-photo"].width);
  const [height, setHeight] = useState(PRESETS["ssc-photo"].height);
  const [targetKb, setTargetKb] = useState(45);
  const [mode, setMode] = useState<"fit" | "crop">("crop");
  const [subsampling, setSubsampling] = useState<"4:2:0" | "4:4:4">("4:2:0");

  const [rawFile, setRawFile] = useState<File | null>(null);
  const [rawUrl, setRawUrl] = useState<string | null>(null);
  const [rawPreviewUrl, setRawPreviewUrl] = useState<string | null>(null);
  const [rawSizeKb, setRawSizeKb] = useState(0);

  const [compResult, setCompResult] = useState<CompressionResult | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [statusMessage, setStatusMessage] = useState("LIVE_PREVIEW_ACTIVE");

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
      
      // Clean up previous URL
      if (rawUrl) {
        URL.revokeObjectURL(rawUrl);
      }

      setRawFile(file);
      setRawSizeKb(file.size / 1024);
      
      const newUrl = URL.createObjectURL(file);
      setRawUrl(newUrl);
      setRawPreviewUrl(null);
      setCompResult(null);

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

  const runCompiler = React.useCallback(async () => {
    if (!rawFile) return;
    setIsCompiling(true);
    setStatusMessage("COMPILING_IMAGE_BUFFER...");

    const preset = PRESETS[activePresetKey];
    const bufferRange = 5; // offset buffer
    const minKb = activePresetKey === "custom" ? Math.max(1, targetKb - bufferRange) : preset.minKb;
    const maxKb = activePresetKey === "custom" ? targetKb + bufferRange : preset.maxKb;

    try {
      const img = await loadImage(rawFile);
      
      // Generate uncompressed high-quality preview at target dimensions/mode for pixel-perfect comparison
      const previewCanvas = drawImageToCanvas(img, width, height, mode);
      const previewUrl = previewCanvas.toDataURL("image/png");
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
      setStatusMessage("COMPRESSION_SUCCESSFUL");
    } catch (err: any) {
      console.error(err);
      setStatusMessage("COMPRESSION_FAILED");
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
    };
  }, [rawUrl]);

  const handleSliderMove = (clientX: number) => {
    if (!splitRef.current) return;
    const rect = splitRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDraggingSlider(false);
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const activePreset = PRESETS[activePresetKey];
  const isCustom = activePresetKey === "custom";

  return (
    <main className="pt-16 pb-[40px] min-h-screen flex flex-col md:flex-row">
      {/* Left Config Panel */}
      <aside className="w-full md:w-[41.66%] border-r border-carbon bg-surface-container-low/80 backdrop-blur-sm p-8 flex flex-col gap-8 custom-scrollbar overflow-y-auto">
        <section>
          <h2 className="font-label-bold text-label-bold text-carbon border-b border-carbon pb-2 mb-6 uppercase">
            [IMAGE_INPUT_METRICS]
          </h2>
          <div className="space-y-6">
            {/* Preset Dropdown */}
            <div className="flex flex-col gap-2">
              <label className="font-metadata text-metadata text-secondary uppercase">Active_Preset</label>
              <select
                value={activePresetKey}
                onChange={e => selectPreset(e.target.value)}
                className="bg-white border border-carbon rounded-none font-body-md p-3 focus:outline-none focus:border-primary w-full"
              >
                {Object.entries(PRESETS).map(([key, p]) => (
                  <option key={key} value={key}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Spec readout card */}
            <div className="bg-carbon text-surface-bright p-4 font-metadata text-[11px] leading-relaxed tracking-wider">
              <div className="flex justify-between border-b border-surface-variant/20 pb-1 mb-1">
                <span>DIMENSION_SPEC</span>
                <span>
                  {isCustom ? "CUSTOM_DIMENSIONS" : `${activePreset.width}x${activePreset.height} px`}
                </span>
              </div>
              <div className="flex justify-between border-b border-surface-variant/20 pb-1 mb-1">
                <span>SIZE_CONSTRAINTS</span>
                <span>
                  {isCustom ? "DYNAMIC_TARGET" : `MIN: ${activePreset.minKb}KB // MAX: ${activePreset.maxKb}KB`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>EXPORT_TYPE</span>
                <span>JPG</span>
              </div>
            </div>

            {/* Params inputs */}
            <div className="space-y-6 pt-4">
              <div className="flex flex-col gap-2">
                <label className="font-metadata text-metadata text-secondary uppercase flex justify-between">
                  Target Resolution <span>[{isCustom ? "EDITABLE" : "LOCKED"}]</span>
                </label>
                <div className="flex gap-2">
                  <input
                    value={width}
                    onChange={e => setWidth(Math.max(1, parseInt(e.target.value) || 0))}
                    disabled={!isCustom}
                    className="w-full bg-surface-container-highest border border-outline-variant font-body-md p-2 text-center disabled:opacity-60 rounded-none focus:outline-none focus:border-primary"
                    type="number"
                  />
                  <span className="flex items-center">x</span>
                  <input
                    value={height}
                    onChange={e => setHeight(Math.max(1, parseInt(e.target.value) || 0))}
                    disabled={!isCustom}
                    className="w-full bg-surface-container-highest border border-outline-variant font-body-md p-2 text-center disabled:opacity-60 rounded-none focus:outline-none focus:border-primary"
                    type="number"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border border-carbon p-3 bg-white">
                <span className="font-metadata text-metadata uppercase">Aspect Ratio Lock</span>
                <div className="flex items-center gap-2 text-primary font-bold">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                  <span className="font-metadata text-metadata">
                    [{isCustom ? "AUTO" : `LOCKED: ${activePreset.ratioText}`}]
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-metadata text-metadata text-secondary uppercase">
                  Target Size Limit ({isCustom ? "KB" : "PRESET_TARGET"})
                </label>
                <input
                  value={targetKb}
                  onChange={e => setTargetKb(Math.max(5, parseInt(e.target.value) || 0))}
                  disabled={!isCustom}
                  className="bg-white border border-carbon font-body-md p-3 focus:outline-none focus:border-primary rounded-none disabled:opacity-60"
                  type="number"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-metadata text-metadata text-secondary uppercase">Resize Engine Mode</label>
                <div className="grid grid-cols-2 border border-carbon">
                  <button
                    onClick={() => setMode("crop")}
                    className={`p-3 font-metadata text-[10px] uppercase transition-all ${
                      mode === "crop" ? "bg-carbon text-white" : "bg-white text-carbon hover:bg-surface-container-high"
                    }`}
                  >
                    CROP (Fit Ratio)
                  </button>
                  <button
                    onClick={() => setMode("fit")}
                    className={`p-3 font-metadata text-[10px] uppercase transition-all ${
                      mode === "fit" ? "bg-carbon text-white" : "bg-white text-carbon hover:bg-surface-container-high"
                    }`}
                  >
                    PAD (White Margins)
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-metadata text-metadata text-secondary uppercase">Chroma Subsampling</label>
                <div className="grid grid-cols-2 border border-carbon">
                  <button
                    onClick={() => setSubsampling("4:2:0")}
                    className={`p-3 font-metadata text-[10px] uppercase transition-all ${
                      subsampling === "4:2:0" ? "bg-carbon text-white" : "bg-white text-carbon hover:bg-surface-container-high"
                    }`}
                  >
                    4:2:0 - HIGH COMPRESSION
                  </button>
                  <button
                    onClick={() => setSubsampling("4:4:4")}
                    className={`p-3 font-metadata text-[10px] uppercase transition-all ${
                      subsampling === "4:4:4" ? "bg-carbon text-white" : "bg-white text-carbon hover:bg-surface-container-high"
                    }`}
                  >
                    4:4:4 - HIGHEST DETAIL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-auto pt-8">
          <button
            onClick={runCompiler}
            disabled={isCompiling || !rawFile}
            className="w-full bg-carbon text-white py-5 px-6 rounded-full font-label-bold text-label-bold uppercase tracking-widest hover:bg-muted-teal disabled:opacity-50 transition-all flex items-center justify-center gap-3 group"
          >
            <span>{isCompiling ? "[RUNNING_COMPILER...]" : "[RUN_COMPRESSION_COMPILER]"}</span>
            <span className={`material-symbols-outlined ${isCompiling ? "animate-spin" : "group-hover:rotate-180"} transition-transform`}>
              settings_backup_restore
            </span>
          </button>
        </div>
      </aside>

      {/* Right View Panel */}
      <section className="w-full md:w-[58.34%] flex flex-col">
        <div className="flex-grow bg-white/40 flex flex-col relative overflow-hidden h-[450px] md:h-full">
          {/* Top Info Bar */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <div className="bg-carbon text-white px-3 py-1 font-metadata text-[10px] uppercase flex items-center gap-2">
              <span className="w-2 h-2 bg-muted-teal rounded-full animate-pulse"></span>
              {statusMessage}
            </div>
            <div className="bg-surface-container-high border border-carbon px-3 py-1 font-metadata text-[10px] uppercase">
              ZOOM: 100%
            </div>
          </div>

          {/* Interactive drop zone / comparison */}
          {!rawUrl ? (
            <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-outline m-8 bg-surface-container-lowest">
              <span className="material-symbols-outlined text-4xl text-secondary mb-4">upload_file</span>
              <p className="font-label-bold text-label-bold uppercase mb-2">[DROP_SOURCE_FILE]</p>
              <p className="font-metadata text-metadata text-outline-variant mb-6">SUPPORTED: JPG, PNG, WEBP (Max 15MB)</p>
              <label className="px-6 py-3 bg-carbon text-white uppercase font-metadata text-metadata rounded-full hover:bg-muted-teal transition-all cursor-pointer">
                Browse Files
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          ) : (
            <div
              ref={splitRef}
              onMouseMove={e => isDraggingSlider && handleSliderMove(e.clientX)}
              onTouchMove={e => isDraggingSlider && e.touches[0] && handleSliderMove(e.touches[0].clientX)}
              className="flex-grow relative select-none bg-surface-container-low overflow-hidden"
            >
              {/* Left Side: Original Image (takes 100% width, clipped on the right half) */}
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
                  RAW: {rawFile?.name.substring(0, 15)}... ({rawSizeKb.toFixed(1)} KB)
                </div>
              </div>

              {/* Right Side: Optimized preview / sliding layer (takes 100% width, clipped on the left half) */}
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
                    [AWAITING_COMPILATION]
                  </div>
                )}
                {compResult && (
                  <div className="absolute bottom-4 right-4 font-metadata text-metadata bg-carbon text-white px-2 py-1 uppercase border border-carbon z-20">
                    COMPILED: {compResult.sizeKb.toFixed(1)} KB
                  </div>
                )}
              </div>

              {/* Slider boundary handle */}
              <div
                className="absolute top-0 bottom-0 z-30 w-px bg-carbon"
                style={{ left: `${sliderPos}%` }}
              >
                <div
                  onMouseDown={() => setIsDraggingSlider(true)}
                  onTouchStart={() => setIsDraggingSlider(true)}
                  className="absolute top-1/2 left-1/2 w-8 h-8 bg-carbon rounded-full flex items-center justify-center text-white cursor-col-resize shadow-xl -translate-x-1/2 -translate-y-1/2 z-30 select-none"
                >
                  <span className="material-symbols-outlined text-[16px]">unfold_more</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Telemetry Output Bar */}
        <div className="h-24 bg-surface-container-highest border-t border-carbon flex divide-x divide-carbon">
          <div className="flex-1 p-4 flex flex-col justify-center">
            <span className="font-metadata text-[10px] text-secondary mb-1">FILE_SIZE</span>
            <div className="flex items-center gap-2">
              <span className="font-label-bold text-headline-sm">
                {compResult ? `${compResult.sizeKb.toFixed(1)} KB` : "N/A"}
              </span>
              {compResult && (
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                  [COMPLIANT]
                </span>
              )}
            </div>
          </div>
          <div className="flex-grow flex-1 p-4 flex flex-col justify-center">
            <span className="font-metadata text-[10px] text-secondary mb-1">DIMENSIONS</span>
            <div className="flex items-center gap-2">
              <span className="font-label-bold text-headline-sm">
                {compResult ? `${compResult.width}x${compResult.height} PX` : "N/A"}
              </span>
              {compResult && (
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                  [COMPLIANT]
                </span>
              )}
            </div>
          </div>
          <div className="flex-grow flex-1 p-4 flex flex-col justify-center">
            <span className="font-metadata text-[10px] text-secondary mb-1">PIXEL_RATIO</span>
            <div className="flex items-center gap-2">
              <span className="font-label-bold text-headline-sm">
                {compResult ? "1.000" : "N/A"}
              </span>
              {compResult && (
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                  [COMPLIANT]
                </span>
              )}
            </div>
          </div>
          <div className="w-64 p-4 flex items-center justify-center">
            {compResult ? (
              <a
                href={compResult.url}
                download={`optimized_${rawFile?.name.split(".")[0]}.jpg`}
                className="w-full h-full border border-carbon rounded-full font-metadata text-metadata uppercase hover:bg-muted-teal hover:text-white transition-all flex items-center justify-center gap-2 group"
              >
                [DOWNLOAD_IMAGE_JPG]
                <span className="material-symbols-outlined text-[18px] group-hover:translate-y-1 transition-transform">
                  download
                </span>
              </a>
            ) : (
              <button
                disabled
                className="w-full h-full border border-outline-variant text-outline-variant rounded-full font-metadata text-metadata uppercase flex items-center justify-center gap-2 cursor-not-allowed"
              >
                [AWAITING_COMPILATION]
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
