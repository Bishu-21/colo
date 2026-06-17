"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { CompressionResult, loadImage } from "@/utils/imageCompressor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { ToolLayout } from "@/components/ui/ToolLayout";
import { saveFileToVault, getFileFromVault } from "@/utils/fileVault";
import SandboxVault from "@/components/SandboxVault";
import Script from "next/script";
import { showToast } from "@/utils/toast";


interface ExamPreset {
  name: string;
  width: number;
  height: number;
  minKb: number;
  maxKb: number;
  ratioText: string;
}

const INDIAN_PRESETS: Record<string, ExamPreset> = {
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
    name: "Indian Passport Standard",
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

const GLOBAL_PRESETS: Record<string, ExamPreset> = {
  "us-visa": {
    name: "United States - Visa (2x2 inch)",
    width: 600,
    height: 600,
    minKb: 10,
    maxKb: 240,
    ratioText: "1:1",
  },
  "schengen-visa": {
    name: "Schengen Area - Visa (35x45mm)",
    width: 413,
    height: 531,
    minKb: 10,
    maxKb: 240,
    ratioText: "35:45",
  },
  "uk-passport": {
    name: "United Kingdom - Passport (35x45mm)",
    width: 413,
    height: 531,
    minKb: 10,
    maxKb: 240,
    ratioText: "35:45",
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
  const [routeType, setRouteType] = useState<"india" | "global">("india");

  const PRESETS = routeType === "india" ? INDIAN_PRESETS : GLOBAL_PRESETS;

  const [activePresetKey, setActivePresetKey] = useState("ssc-photo");
  const [width, setWidth] = useState(INDIAN_PRESETS["ssc-photo"].width);
  const [height, setHeight] = useState(INDIAN_PRESETS["ssc-photo"].height);
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

  const [imageId, setImageId] = useState<string | null>(null);

  // Payment, licensing, and shagun-paywall states
  const [isProUnlocked, setIsProUnlocked] = useState(false);
  const [isCurrentFilePaid, setIsCurrentFilePaid] = useState(false);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Auto detect user location / route type on mount
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const isIndian = navigator.language.includes("IN") || tz === "Asia/Kolkata";
      if (isIndian) {
        setRouteType("india");
        setActivePresetKey("ssc-photo");
        setWidth(INDIAN_PRESETS["ssc-photo"].width);
        setHeight(INDIAN_PRESETS["ssc-photo"].height);
        setTargetKb(45);
      } else {
        setRouteType("global");
        setActivePresetKey("us-visa");
        setWidth(GLOBAL_PRESETS["us-visa"].width);
        setHeight(GLOBAL_PRESETS["us-visa"].height);
        setTargetKb(120);
      }
    } catch (err) {
      console.error("Auto detect locale failed:", err);
    }
  }, []);

  const XOR_KEY = 0x5F;
  const encryptString = useCallback((str: string): string => {
    if (typeof window === "undefined") return "";
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const xored = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      xored[i] = bytes[i] ^ XOR_KEY;
    }
    let binary = "";
    for (let i = 0; i < xored.length; i++) {
      binary += String.fromCharCode(xored[i]);
    }
    return btoa(binary);
  }, []);

  const decryptString = useCallback((hash: string): string => {
    if (typeof window === "undefined" || !hash) return "";
    try {
      const binary = atob(hash);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i) ^ XOR_KEY;
      }
      const decoder = new TextDecoder();
      return decoder.decode(bytes);
    } catch (e) {
      return "";
    }
  }, []);

  // Load B2B Pro state on mount
  useEffect(() => {
    const proState = localStorage.getItem("morpee_pro_scanner");
    if (proState) {
      if (proState === "license_verified_csc_pro") {
        setIsProUnlocked(true);
      } else {
        const decrypted = decryptString(proState);
        if (decrypted === "license_verified_csc_pro") {
          setIsProUnlocked(true);
        }
      }
    }
  }, [decryptString]);

  // Update preview image reactivity when user unlocks details
  useEffect(() => {
    if ((isProUnlocked || isCurrentFilePaid) && compResult && imageId) {
      setCompResult(prev => {
        if (!prev) return null;
        return {
          ...prev,
          previewUrl: `/api/image/download/${imageId}`
        } as any;
      });
    }
  }, [isProUnlocked, isCurrentFilePaid, compResult, imageId]);

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

  const loadImageFile = (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      showToast("FILE SIZE LIMIT: The selected file exceeds 25MB. Please upload a smaller image file for secure hybrid processing stability.", "error");
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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      loadImageFile(e.target.files[0]);
    }
  };

  const loadFileFromVault = (file: File) => {
    loadImageFile(file);
  };

  // Autoload Vault File if routed with autoload ID
  useEffect(() => {
    if (typeof window !== "undefined") {
      const autoloadId = sessionStorage.getItem("morpee_autoload_vault_id");
      if (autoloadId) {
        sessionStorage.removeItem("morpee_autoload_vault_id");
        getFileFromVault(autoloadId)
          .then((vf) => {
            if (vf) {
              const blob = new Blob([vf.data], { type: vf.type });
              const file = new File([blob], vf.name, { type: vf.type });
              loadImageFile(file);
            }
          })
          .catch((err) => console.error("Failed to autoload vault file:", err));
      }
    }
  }, []);

  const runCompiler = useCallback(async () => {
    if (!rawFile) return;
    setIsCompiling(true);
    setStatusMessage("Uploading and optimizing...");

    const activePreset = PRESETS[activePresetKey];
    const bufferRange = 5; // offset buffer
    const minKb = activePresetKey === "custom" ? Math.max(1, targetKb - bufferRange) : activePreset.minKb;
    const maxKb = activePresetKey === "custom" ? targetKb + bufferRange : activePreset.maxKb;

    try {
      // Create raw preview URL for the comparison slider if not loaded
      if (!rawPreviewUrl) {
        const previewUrl = URL.createObjectURL(rawFile);
        rawPreviewUrlRef.current = previewUrl;
        setRawPreviewUrl(previewUrl);
      }

      const fd = new FormData();
      fd.append("file", rawFile);
      fd.append("width", width.toString());
      fd.append("height", height.toString());
      fd.append("mode", mode);
      fd.append("minKb", minKb.toString());
      fd.append("maxKb", maxKb.toString());

      const res = await fetch("/api/image/process", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Optimization failed");

      setImageId(data.id);
      setIsCurrentFilePaid(data.isPaid);

      setCompResult({
        sizeKb: data.sizeKb,
        width: data.width,
        height: data.height,
        previewUrl: data.previewUrl, // Holds watermarked base64 image
        iterations: 1,
        quality: 0.8,
        url: data.previewUrl,
      } as any);

      setStatusMessage("Optimization complete");
      
      // Auto focus preview step on mobile to show the output image comparison
      setCurrentStep("preview");
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Optimization failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsCompiling(false);
    }
  }, [rawFile, activePresetKey, targetKb, width, height, mode, PRESETS, rawPreviewUrl]);


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

  const triggerServerDownload = () => {
    if (!imageId) return;
    const cleanUrl = `/api/image/download/${imageId}`;
    const a = document.createElement("a");
    a.href = cleanUrl;
    a.download = `optimized_${rawFile?.name.split(".")[0] || "image"}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!imageId) return;

    if (isProUnlocked || isCurrentFilePaid) {
      triggerServerDownload();
    } else {
      // Try to unlock using credits first
      setIsProcessingPayment(true);
      try {
        const res = await fetch("/api/image/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageId }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setIsCurrentFilePaid(true);
          // Refresh user credits display
          window.dispatchEvent(new Event("morpee_credits_changed"));
          // Trigger download
          triggerServerDownload();
        } else if (res.status === 402) {
          // Open paywall modal
          setShowPaywallModal(true);
        } else {
          throw new Error(data.error || "Credit check failed");
        }
      } catch (err: any) {
        console.error(err);
        setShowPaywallModal(true);
      } finally {
        setIsProcessingPayment(false);
      }
    }
  };

  const handleSaveToVaultClick = async () => {
    if (!imageId || !rawFile) return;

    if (isProUnlocked || isCurrentFilePaid) {
      try {
        const res = await fetch(`/api/image/download/${imageId}`);
        if (!res.ok) throw new Error("Failed to fetch clean document file");
        const downloadBlob = await res.blob();
        const optimizedFile = new File([downloadBlob], `optimized_${rawFile.name.split(".")[0]}.jpg`, { type: "image/jpeg" });
        await saveFileToVault(optimizedFile);
        showToast("Success: Optimized image saved to Local Sandbox Vault!", "success");
      } catch (err) {
        console.error(err);
        showToast("Error: Failed to save to local vault.", "error");
      }
    } else {
      setShowPaywallModal(true);
    }
  };

  const handlePayAttempt = async (planId: string, amount: number) => {
    setIsProcessingPayment(true);
    try {
      const currency = routeType === "india" ? "INR" : "USD";
      // 1. Create order on the server
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, amount, currency }),
      });
      const orderData = await res.json();

      if (!res.ok) throw new Error(orderData.error || "Order creation failed");

      // 2. Configure Razorpay checkout options
      const options = {
        key: "rzp_test_SZVx0rrecXZLzT", // Active merchant sandbox test key
        amount: orderData.amount,
        currency: orderData.currency,
        name: "MORPEE Document Engine",
        description: planId === "single-photo" ? "Document sizing compliance" : "Premium Plan",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // Verify payment on the server
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId,
                amount,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              showToast("SECURE NODE: PAYMENT VERIFIED. FILE UNLOCKED!", "success");
              if (planId === "single-photo") {
                setIsCurrentFilePaid(true);
                // Mark this specific image as paid on server
                if (imageId) {
                  await fetch("/api/image/unlock", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageId }),
                  });
                }
                // Refresh credits display
                window.dispatchEvent(new Event("morpee_credits_changed"));
              } else {
                // Upgraded to Pro!
                localStorage.setItem("morpee_pro_scanner", encryptString("license_verified_csc_pro"));
                setIsProUnlocked(true);
              }
              setShowPaywallModal(false);
            } else {
              throw new Error(verifyData.error || "Verification failed");
            }
          } catch (err: any) {
            showToast(`PAYMENT_ERROR: Verification failed. ${err.message}. If money was deducted, credits will sync in the background.`, "error");
          }
        },
        prefill: {
          email: "candidate@secure.node",
          contact: "9999999999",
        },
        theme: {
          color: "#30645d", // Primary Teal
        },
      };

      const customWindow = window as any;
      if (!customWindow.Razorpay) {
        throw new Error("Razorpay SDK not loaded yet. Click again in a moment.");
      }
      const rzp = new customWindow.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      showToast(`Razorpay Gateway Alert: ${err.message || "Failed to initialize payment"}`, "error");
    } finally {
      setIsProcessingPayment(false);
    }
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
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingSlider || !splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0]?.clientX : e.clientX;
      if (clientX === undefined) return;
      
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPos(percentage);
    };

    const handleRelease = () => setIsDraggingSlider(false);

    if (isDraggingSlider) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("touchmove", handleMove);
      window.addEventListener("mouseup", handleRelease);
      window.addEventListener("touchend", handleRelease);
      window.addEventListener("touchcancel", handleRelease);
    }

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleRelease);
      window.removeEventListener("touchend", handleRelease);
      window.removeEventListener("touchcancel", handleRelease);
    };
  }, [isDraggingSlider]);

  const activePreset = PRESETS[activePresetKey];
  const isCustom = activePresetKey === "custom";

  return (
    <div className="flex flex-col md:h-[calc(100vh-124px)] md:min-h-0 md:overflow-hidden">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
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
        className={`h-[calc(100vh-174px)] md:h-[calc(100vh-124px)] ${compResult ? "pb-[160px] md:pb-0" : "pb-[80px] md:pb-0"}`}
        sidebar={
          <div className={currentStep === "preset" ? "block" : "hidden md:block"}>
            <section>
              <h2 className="font-label-bold text-label-bold text-carbon border-b border-carbon pb-2 mb-6 uppercase">
                Resize Options
              </h2>
              <div className="space-y-6">
                {/* Route Manual Toggle */}
                <div className="flex border border-carbon p-1 bg-surface-container">
                  <button
                    type="button"
                    onClick={() => {
                      setRouteType("india");
                      setActivePresetKey("ssc-photo");
                      const preset = INDIAN_PRESETS["ssc-photo"];
                      setWidth(preset.width);
                      setHeight(preset.height);
                      setTargetKb(Math.round((preset.minKb + preset.maxKb) / 2));
                      setMode("crop");
                    }}
                    className={`flex-1 py-1.5 text-center text-[10px] font-label-bold uppercase tracking-wider cursor-pointer transition-all ${
                      routeType === "india" ? "bg-carbon text-white shadow-sm" : "bg-transparent text-carbon hover:bg-black/5"
                    }`}
                  >
                    🇮🇳 Indian Exams
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRouteType("global");
                      setActivePresetKey("us-visa");
                      const preset = GLOBAL_PRESETS["us-visa"];
                      setWidth(preset.width);
                      setHeight(preset.height);
                      setTargetKb(Math.round((preset.minKb + preset.maxKb) / 2));
                      setMode("crop");
                    }}
                    className={`flex-1 py-1.5 text-center text-[10px] font-label-bold uppercase tracking-wider cursor-pointer transition-all ${
                      routeType === "global" ? "bg-carbon text-white shadow-sm" : "bg-transparent text-carbon hover:bg-black/5"
                    }`}
                  >
                    🌐 Global Visas
                  </button>
                </div>

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

            <div className="mt-auto pt-8 space-y-6">
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

              <SandboxVault 
                onLoadFileAction={loadFileFromVault} 
                activeFileNames={rawFile ? [rawFile.name] : []} 
              />
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
                    src={(compResult as any).previewUrl || compResult.url}
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
              <Button
                variant="outline"
                size="full"
                onClick={handleDownloadClick}
                className="h-full hover:bg-muted-teal text-xs md:text-metadata font-metadata group min-h-[44px]"
              >
                Download Optimized JPG
                <span className="material-symbols-outlined text-[18px] group-hover:translate-y-1 transition-transform">
                  download
                </span>
              </Button>
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
          {compResult && (
            <div className="w-64 p-4 flex items-center justify-center">
              <Button
                variant="outline"
                size="full"
                className="h-full hover:bg-muted-teal text-xs md:text-metadata font-metadata group min-h-[44px]"
                onClick={handleSaveToVaultClick}
              >
                Save to Vault
                <span className="material-symbols-outlined text-[18px]">archive</span>
              </Button>
            </div>
          )}

        </div>
      </ToolLayout>

      {/* Sticky Mobile Download CTA - visible only on mobile, when compResult exists */}
      {compResult && (
        <div className="md:hidden fixed bottom-[50px] left-0 w-full z-40 bg-white border-t border-carbon p-4 select-none">
          <Button
            variant="secondary"
            size="full"
            onClick={handleDownloadClick}
            className="h-12 text-[11px] font-metadata group min-h-[44px]"
          >
            Download Optimized JPG
            <span className="material-symbols-outlined text-[18px] group-hover:translate-y-1 transition-transform">
              download
            </span>
          </Button>
        </div>
      )}

      {/* UPI Shagun Paywall Modal */}
      {showPaywallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in select-none">
          <div className="double-border max-w-md w-full bg-white relative">
            <div className="double-border-inner p-6 space-y-6">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-carbon pb-3">
                <h3 className="font-label-bold text-sm uppercase text-carbon flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-error">lock_open</span>
                  [VERIFICATION_PAYWALL_LOCK]
                </h3>
                <button
                  onClick={() => setShowPaywallModal(false)}
                  className="text-secondary hover:text-carbon font-metadata text-xs cursor-pointer"
                >
                  [CLOSE]
                </button>
              </div>

              {/* Anti-Anxiety Pitch */}
              <div className="space-y-3">
                <div className="bg-error/5 border border-error/25 p-4 text-xs leading-relaxed text-error font-body-md">
                  <span className="font-bold uppercase block mb-1">
                    {routeType === "india" 
                      ? "⚠️ Warning: Screenshot Jugaad Fails Portal Scans" 
                      : "⚠️ Warning: Visual Watermarks & Low DPI Block Visas"}
                  </span>
                  {routeType === "india"
                    ? "Government exam systems (UPSC/SSC/NTA) verify backend properties (DPI, exact KB metadata size, and aspect ratios). A screenshot will result in immediate form rejection. Secure your application attempt."
                    : "Embassies and passport offices (US Department of State, Schengen Consulates, etc.) use biometric scanners checking facial alignment and white backgrounds. Screenshots are rejected. Secure your visa application."}
                </div>
                <p className="font-body-md text-xs text-secondary leading-relaxed">
                  We process files securely in our encrypted sandboxed environment. Unlock the certified compliant file with zero watermarks:
                </p>
              </div>

              {/* Offers List */}
              <div className="space-y-3">
                <div 
                  onClick={() => handlePayAttempt("single-photo", routeType === "india" ? 19 : 2.99)}
                  className="border border-carbon/25 p-4 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all flex justify-between items-center"
                >
                  <div>
                    <span className="font-label-bold text-xs uppercase text-carbon block">Single Compliant Attempt</span>
                    <span className="font-metadata text-[9px] text-secondary">
                      {routeType === "india" ? "₹19 one-time (5 bonus credits)" : "$2.99 one-time (5 bonus credits)"}
                    </span>
                  </div>
                  <span className="font-label-bold text-xs text-primary bg-primary/10 px-2.5 py-1 border border-primary/20 rounded-sm">
                    {routeType === "india" ? "[Pay ₹19]" : "[Pay $2.99]"}
                  </span>
                </div>

                <div 
                  onClick={() => handlePayAttempt("candidate", routeType === "india" ? 49 : 9.99)}
                  className="border border-carbon/25 p-4 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all flex justify-between items-center"
                >
                  <div>
                    <span className="font-label-bold text-xs uppercase text-carbon block">Full Candidate Pass</span>
                    <span className="font-metadata text-[9px] text-secondary">
                      {routeType === "india" ? "₹49 // 30 days unlimited crops (100 credits)" : "$9.99 // 30 days unlimited crops (100 credits)"}
                    </span>
                  </div>
                  <span className="font-label-bold text-xs text-primary bg-primary/10 px-2.5 py-1 border border-primary/20 rounded-sm">
                    {routeType === "india" ? "[Pay ₹49]" : "[Pay $9.99]"}
                  </span>
                </div>

                <div 
                  onClick={() => handlePayAttempt("csc", routeType === "india" ? 499 : 49.99)}
                  className="border border-carbon/25 p-4 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all flex justify-between items-center"
                >
                  <div>
                    <span className="font-label-bold text-xs uppercase text-carbon block">B2B CSC Operator Pass</span>
                    <span className="font-metadata text-[9px] text-secondary">
                      {routeType === "india" ? "₹499 // Monthly cyber cafe batch queue (1000 credits)" : "$49.99 // Monthly cyber cafe batch queue (1000 credits)"}
                    </span>
                  </div>
                  <span className="font-label-bold text-xs text-primary bg-primary/10 px-2.5 py-1 border border-primary/20 rounded-sm">
                    {routeType === "india" ? "[Pay ₹499]" : "[Pay $49.99]"}
                  </span>
                </div>
              </div>

              {/* Loader */}
              {isProcessingPayment && (
                <div className="text-center font-metadata text-[10px] uppercase text-primary animate-pulse">
                  {routeType === "india"
                    ? "Connecting to Razorpay UPI secure gateway..."
                    : "Connecting to international card processing gateway..."}
                </div>
              )}

              {/* Footer Badge */}
              <div className="pt-3 border-t border-carbon/10 text-center font-metadata text-[9px] text-secondary uppercase tracking-wider flex justify-center items-center gap-1.5">
                <span className="material-symbols-outlined text-[12px] text-primary">verified_user</span>
                {routeType === "india"
                  ? "100% Secure UPI Payment (GPay, PhonePe, Paytm)"
                  : "100% Secure Card Payment & Apple Pay"}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

