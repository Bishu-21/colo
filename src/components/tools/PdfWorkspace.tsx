"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { saveFileToVault, getFileFromVault } from "@/utils/fileVault";
import { showToast } from "@/utils/toast";
import SandboxVault from "@/components/SandboxVault";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface PdfPageItem {
  id: string;
  originalUrl: string; // base64 page render
  editedUrl: string;   // cropped/filtered base64 page render
  width: number;
  height: number;
  rotation: number;
  cropRect: { x: number; y: number; width: number; height: number } | null;
  filter: "original" | "magic" | "grayscale" | "bw";
  brightness: number;
  contrast: number;
  saturation: number;
}

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
  const [pdfResult, setPdfResult] = useState<{
    blob: Blob;
    url: string;
    sizeKb: number;
    pagesCount: number;
  } | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Awaiting input document");

  // Multi-page states
  const [pdfPages, setPdfPages] = useState<PdfPageItem[]>([]);

  // Page Editor States
  const [editingPageIdx, setEditingPageIdx] = useState<number | null>(null);
  const [editorImage, setEditorImage] = useState<string>("");
  const [editorCropRect, setEditorCropRect] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 1, height: 1 });
  const [editorRotation, setEditorRotation] = useState<number>(0);
  const [editorFilter, setEditorFilter] = useState<"original" | "magic" | "grayscale" | "bw">("original");
  const [editorBrightness, setEditorBrightness] = useState<number>(0);
  const [editorContrast, setEditorContrast] = useState<number>(0);
  const [editorSaturation, setEditorSaturation] = useState<number>(0);
  const [editorAspectRatio, setEditorAspectRatio] = useState<string>("free");

  // Draggable handles states
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{
    clientX: number;
    clientY: number;
    cropRect: { x: number; y: number; width: number; height: number };
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const originalImgRef = useRef<HTMLImageElement>(null);

  // Sync profile select changes
  const selectProfile = (key: string) => {
    setPipelineKey(key);
    const pipeline = PIPELINES[key];
    setDpi(pipeline.dpi);
    setQuality(pipeline.quality);
  };

  const applyFilter = useCallback((
    url: string,
    mode: "original" | "magic" | "grayscale" | "bw",
    bright: number,
    contr: number,
    sat: number
  ) => {
    if (!url) return "";
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.src = url;
    
    const w = img.naturalWidth || 600;
    const h = img.naturalHeight || 850;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return url;
    ctx.drawImage(img, 0, 0, w, h);

    if (mode === "original" && bright === 0 && contr === 0 && sat === 0) return url;

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const bVal = (bright / 100) * 255;
    const cFactor = contr === 0 ? 1 : (259 * (contr + 255)) / (255 * (259 - contr));
    const sFactor = (sat + 100) / 100;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      if (mode === "grayscale") {
        const y = 0.299 * r + 0.587 * g + 0.114 * b;
        r = g = b = y;
      } else if (mode === "bw") {
        const y = 0.299 * r + 0.587 * g + 0.114 * b;
        const val = y > 128 ? 255 : 0;
        r = g = b = val;
      } else if (mode === "magic") {
        const y = 0.299 * r + 0.587 * g + 0.114 * b;
        let newR = r;
        let newG = g;
        let newB = b;

        if (y > 140) {
          newR = Math.min(255, r * 1.35);
          newG = Math.min(255, g * 1.35);
          newB = Math.min(255, b * 1.35);
        } else if (y < 85) {
          newR = r * 0.6;
          newG = g * 0.6;
          newB = b * 0.6;
        } else {
          newR = (r - 85) * (255 / 55);
          newG = (g - 85) * (255 / 55);
          newB = (b - 85) * (255 / 55);
        }

        r = Math.max(0, Math.min(255, newR));
        g = Math.max(0, Math.min(255, newG));
        b = Math.max(0, Math.min(255, newB));
      }

      if (bright !== 0) {
        r += bVal;
        g += bVal;
        b += bVal;
      }

      if (contr !== 0) {
        r = cFactor * (r - 128) + 128;
        g = cFactor * (g - 128) + 128;
        b = cFactor * (b - 128) + 128;
      }

      if (sat !== 0 && mode !== "grayscale" && mode !== "bw") {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray + (r - gray) * sFactor;
        g = gray + (g - gray) * sFactor;
        b = gray + (b - gray) * sFactor;
      }

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL("image/jpeg");
  }, []);

  const [editorPreviewUrl, setEditorPreviewUrl] = useState<string>("");

  useEffect(() => {
    if (editorImage) {
      setEditorPreviewUrl(applyFilter(editorImage, editorFilter, editorBrightness, editorContrast, editorSaturation));
    }
  }, [editorImage, editorFilter, editorBrightness, editorContrast, editorSaturation, applyFilter]);

  // Extract pages from loaded PDF
  const extractPdfPages = async (file: File) => {
    setIsExtracting(true);
    setStatusMessage("Extracting PDF pages...");
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      const pagesCount = pdf.numPages;

      const extracted: PdfPageItem[] = [];

      for (let i = 1; i <= pagesCount; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 150 / 72 }); // Render at 150 DPI baseline
        
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          extracted.push({
            id: `page_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
            originalUrl: dataUrl,
            editedUrl: dataUrl,
            width: viewport.width,
            height: viewport.height,
            rotation: 0,
            cropRect: null,
            filter: "original",
            brightness: 0,
            contrast: 0,
            saturation: 0
          });
        }
      }

      setPdfPages(extracted);
      setStatusMessage(`Extracted ${pagesCount} pages`);
    } catch (err) {
      console.error("Failed to extract PDF pages:", err);
      showToast("Error reading PDF pages. The file might be corrupted or protected.", "error");
    } finally {
      setIsExtracting(false);
    }
  };

  const loadFileFromVault = (file: File) => {
    setRawFile(file);
    setRawSizeKb(file.size / 1024);
    setPdfResult(null);
    extractPdfPages(file);
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
              loadFileFromVault(file);
            }
          })
          .catch((err) => console.error("Failed to autoload vault file:", err));
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRawFile(file);
      setRawSizeKb(file.size / 1024);
      setPdfResult(null);
      extractPdfPages(file);
    }
  };

  const runCompiler = async () => {
    if (pdfPages.length === 0) {
      showToast("Error: No pages available to compile.", "error");
      return;
    }
    setIsCompiling(true);
    setStatusMessage("Compiling PDF...");

    try {
      const { PDFDocument } = await import("pdf-lib");
      const outputPdf = await PDFDocument.create();

      if (stripMetadata || stripAuthor || stripScanner) {
        outputPdf.setTitle("");
        outputPdf.setAuthor("");
        outputPdf.setSubject("");
        outputPdf.setKeywords([]);
        outputPdf.setProducer("");
        outputPdf.setCreator("");
      }

      for (let i = 0; i < pdfPages.length; i++) {
        const page = pdfPages[i];
        
        const img = new Image();
        img.src = page.editedUrl;
        
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const qualityRatio = dpi / 150;
        const canvas = document.createElement("canvas");
        
        const pageRatio = page.width / page.height;
        const targetW = 600 * qualityRatio;
        const targetH = targetW / pageRatio;
        
        canvas.width = targetW;
        canvas.height = targetH;
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }

        const jpegUrl = canvas.toDataURL("image/jpeg", quality);
        const base64 = jpegUrl.split(",")[1];
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let j = 0; j < len; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }

        const embeddedJpg = await outputPdf.embedJpg(bytes);
        
        const pdfWidth = 595;
        const pdfHeight = pdfWidth / pageRatio;
        
        const newPage = outputPdf.addPage([pdfWidth, pdfHeight]);
        newPage.drawImage(embeddedJpg, {
          x: 0,
          y: 0,
          width: pdfWidth,
          height: pdfHeight,
        });
      }

      const outputBytes = await outputPdf.save();
      const outputBlob = new Blob([outputBytes] as unknown as BlobPart[], { type: "application/pdf" });
      
      setPdfResult({
        blob: outputBlob,
        url: URL.createObjectURL(outputBlob),
        sizeKb: outputBlob.size / 1024,
        pagesCount: pdfPages.length,
      });
      setStatusMessage("Compression completed");
    } catch (err) {
      console.error(err);
      setStatusMessage("Compression failed");
      showToast("PDF compilation failed. Verify page structures are valid.", "error");
    } finally {
      setIsCompiling(false);
    }
  };

  // Reordering controls
  const movePageUp = (index: number) => {
    if (index === 0) return;
    const newPages = [...pdfPages];
    const temp = newPages[index];
    newPages[index] = newPages[index - 1];
    newPages[index - 1] = temp;
    setPdfPages(newPages);
  };

  const movePageDown = (index: number) => {
    if (index === pdfPages.length - 1) return;
    const newPages = [...pdfPages];
    const temp = newPages[index];
    newPages[index] = newPages[index + 1];
    newPages[index + 1] = temp;
    setPdfPages(newPages);
  };

  const deletePage = (index: number) => {
    const newPages = [...pdfPages];
    newPages.splice(index, 1);
    setPdfPages(newPages);
  };

  // Editor Actions
  const rotateEditorImage = (direction: "cw" | "ccw") => {
    const img = new Image();
    img.src = editorImage;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (direction === "cw") {
        ctx.translate(canvas.width, 0);
        ctx.rotate(90 * Math.PI / 180);
      } else {
        ctx.translate(0, canvas.height);
        ctx.rotate(-90 * Math.PI / 180);
      }

      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setEditorImage(dataUrl);
      setEditorCropRect({ x: 0, y: 0, width: 1, height: 1 });
    };
  };

  const flipEditorImage = (axis: "h" | "v") => {
    const img = new Image();
    img.src = editorImage;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (axis === "h") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      } else {
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
      }

      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setEditorImage(dataUrl);
      setEditorCropRect({ x: 0, y: 0, width: 1, height: 1 });
    };
  };

  const handleSavePageChanges = () => {
    if (editingPageIdx === null) return;

    const img = new Image();
    img.src = editorPreviewUrl || editorImage;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const cropX = editorCropRect.x * img.width;
      const cropY = editorCropRect.y * img.height;
      const cropW = editorCropRect.width * img.width;
      const cropH = editorCropRect.height * img.height;

      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.9);

      setPdfPages(prev => prev.map((page, idx) => {
        if (idx === editingPageIdx) {
          return {
            ...page,
            originalUrl: editorImage,
            editedUrl: croppedDataUrl,
            cropRect: editorCropRect,
            filter: editorFilter,
            brightness: editorBrightness,
            contrast: editorContrast,
            saturation: editorSaturation,
            width: cropW,
            height: cropH
          };
        }
        return page;
      }));

      setEditingPageIdx(null);
      setStatusMessage(`Page ${editingPageIdx + 1} updated`);
    };
  };

  // Dragging event listeners for rectangular cropping bounds
  const handleDragStart = (handle: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setIsDragging(handle);
    setDragStart({
      clientX,
      clientY,
      cropRect: { ...editorCropRect }
    });
  };

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !dragStart || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const dx = (clientX - dragStart.clientX) / rect.width;
    const dy = (clientY - dragStart.clientY) / rect.height;

    let newX = dragStart.cropRect.x;
    let newY = dragStart.cropRect.y;
    let newW = dragStart.cropRect.width;
    let newH = dragStart.cropRect.height;

    if (isDragging === "move") {
      newX = Math.max(0, Math.min(1 - newW, dragStart.cropRect.x + dx));
      newY = Math.max(0, Math.min(1 - newH, dragStart.cropRect.y + dy));
    } else {
      if (isDragging.includes("l")) {
        const potentialX = dragStart.cropRect.x + dx;
        const potentialW = dragStart.cropRect.width - dx;
        if (potentialX >= 0 && potentialW >= 0.05) {
          newX = potentialX;
          newW = potentialW;
        }
      }
      if (isDragging.includes("r")) {
        const potentialW = dragStart.cropRect.width + dx;
        if (newX + potentialW <= 1 && potentialW >= 0.05) {
          newW = potentialW;
        }
      }
      if (isDragging.includes("t")) {
        const potentialY = dragStart.cropRect.y + dy;
        const potentialH = dragStart.cropRect.height - dy;
        if (potentialY >= 0 && potentialH >= 0.05) {
          newY = potentialY;
          newH = potentialH;
        }
      }
      if (isDragging.includes("b")) {
        const potentialH = dragStart.cropRect.height + dy;
        if (newY + potentialH <= 1 && potentialH >= 0.05) {
          newH = potentialH;
        }
      }

      if (editorAspectRatio !== "free") {
        let ratio = 1;
        if (editorAspectRatio === "1:1") ratio = 1;
        else if (editorAspectRatio === "4:3") ratio = 4 / 3;
        else if (editorAspectRatio === "16:9") ratio = 16 / 9;
        else if (editorAspectRatio === "A4") ratio = 1 / 1.4142;

        const containerRatio = rect.width / rect.height;
        const targetH = (newW * containerRatio) / ratio;

        if (newY + targetH <= 1) {
          newH = targetH;
        } else {
          newW = (newH * ratio) / containerRatio;
        }
      }
    }

    setEditorCropRect({ x: newX, y: newY, width: newW, height: newH });
  }, [isDragging, dragStart, editorAspectRatio]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(null);
    setDragStart(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchend", handleDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  return (
    <main className="pt-16 pb-10 min-h-screen flex flex-col md:flex-row">
      {/* Left Settings Pane */}
      <aside className="w-full md:w-1/3 lg:w-1/4 border-r border-carbon bg-surface-bright p-8 flex flex-col gap-8">
        <div>
          <h2 className="font-headline-sm text-headline-sm uppercase mb-6 flex items-center gap-2">
            <span className="w-2 h-6 bg-muted-teal"></span>
            PDF Compilation Options
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

        <div className="mt-6 border-t border-on-surface pt-6">
          <SandboxVault 
            onLoadFileAction={loadFileFromVault} 
            activeFileNames={rawFile ? [rawFile.name] : []} 
          />
        </div>

        <div className="mt-auto pt-6 border-t border-on-surface">
          <button
            onClick={runCompiler}
            disabled={isCompiling || pdfPages.length === 0}
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
        <div className="flex-1 border border-on-surface flex flex-col overflow-hidden bg-white">
          <div className="p-4 border-b border-on-surface bg-surface-bright flex justify-between items-center">
            <span className="font-metadata text-metadata text-secondary">
              {editingPageIdx !== null 
                ? `Editing Page ${editingPageIdx + 1}` 
                : rawFile 
                  ? `Document: ${rawFile.name.toUpperCase()} (${pdfPages.length} Pages)` 
                  : "Awaiting Document Upload"}
            </span>
            <div className="flex gap-2">
              {editingPageIdx !== null && (
                <button
                  onClick={() => setEditingPageIdx(null)}
                  className="px-3 py-1.5 border border-carbon text-carbon font-label-bold text-xs uppercase hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {editingPageIdx !== null ? (
            /* Page Editor View */
            <div className="flex-grow flex flex-col lg:flex-row overflow-hidden h-full">
              {/* Image Editor Area */}
              <div className="flex-grow bg-[#eceae5] flex items-center justify-center p-6 relative overflow-hidden h-[350px] lg:h-full select-none">
                <div 
                  ref={containerRef} 
                  className="relative max-h-[85%] max-w-[85%] aspect-auto shadow-2xl pointer-events-none"
                >
                  <img
                    ref={originalImgRef}
                    src={editorPreviewUrl || editorImage}
                    alt="Page to edit"
                    className="max-h-[70vh] max-w-[40vw] object-contain pointer-events-none select-none"
                    draggable={false}
                  />

                  {/* 8-point crop overlay box */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${editorCropRect.x * 100}%`,
                      top: `${editorCropRect.y * 100}%`,
                      width: `${editorCropRect.width * 100}%`,
                      height: `${editorCropRect.height * 100}%`,
                      border: '2px solid #30645d',
                      boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.4)', // dim outer area
                      cursor: 'move',
                      pointerEvents: 'auto'
                    }}
                    onMouseDown={(e) => handleDragStart("move", e)}
                    onTouchStart={(e) => handleDragStart("move", e)}
                  >
                    {/* Corner Handles */}
                    {["tl", "tr", "br", "bl"].map(h => (
                      <div
                        key={h}
                        onMouseDown={(e) => handleDragStart(h, e)}
                        onTouchStart={(e) => handleDragStart(h, e)}
                        className={`absolute w-3 h-3 bg-white border border-primary z-20`}
                        style={{
                          left: h.includes("r") ? "100%" : "0%",
                          top: h.includes("b") ? "100%" : "0%",
                          transform: 'translate(-50%, -50%)',
                          cursor: h === "tl" || h === "br" ? "nwse-resize" : "nesw-resize",
                        }}
                      />
                    ))}
                    {/* Edge Handles */}
                    {["t", "r", "b", "l"].map(h => (
                      <div
                        key={h}
                        onMouseDown={(e) => handleDragStart(h, e)}
                        onTouchStart={(e) => handleDragStart(h, e)}
                        className={`absolute bg-white border border-primary z-20`}
                        style={{
                          left: h === "l" ? "0%" : h === "r" ? "100%" : "50%",
                          top: h === "t" ? "0%" : h === "b" ? "100%" : "50%",
                          width: h === "t" || h === "b" ? "12px" : "6px",
                          height: h === "t" || h === "b" ? "6px" : "12px",
                          transform: 'translate(-50%, -50%)',
                          cursor: h === "t" || h === "b" ? "ns-resize" : "ew-resize",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Editor Controls Sidebar */}
              <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-on-surface bg-surface-bright p-6 flex flex-col justify-between overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  {/* Aspect Ratios */}
                  <div>
                    <label className="font-metadata text-metadata text-secondary uppercase block mb-2">Crop Ratio</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "free", label: "Free-form" },
                        { id: "1:1", label: "Square (1:1)" },
                        { id: "4:3", label: "Standard (4:3)" },
                        { id: "16:9", label: "Widescreen (16:9)" },
                        { id: "A4", label: "A4 Page (1:1.41)" },
                      ].map(r => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setEditorAspectRatio(r.id);
                            if (r.id !== "free") {
                              let targetRatio = 1;
                              if (r.id === "1:1") targetRatio = 1;
                              else if (r.id === "4:3") targetRatio = 4/3;
                              else if (r.id === "16:9") targetRatio = 16/9;
                              else if (r.id === "A4") targetRatio = 1 / 1.4142;

                              const containerRatio = 600 / 850;
                              let w = 0.8;
                              let h = (w * containerRatio) / targetRatio;
                              if (h > 0.8) {
                                h = 0.8;
                                w = (h * targetRatio) / containerRatio;
                              }
                              setEditorCropRect({
                                x: (1 - w) / 2,
                                y: (1 - h) / 2,
                                width: w,
                                height: h
                              });
                            }
                          }}
                          className={`py-2 px-3 border text-center text-xs uppercase font-label-bold transition-all ${
                            editorAspectRatio === r.id
                              ? "bg-carbon text-white border-carbon"
                              : "border-outline-variant hover:bg-surface-container-high"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Orientation */}
                  <div>
                    <label className="font-metadata text-metadata text-secondary uppercase block mb-2">Orientation</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => rotateEditorImage("cw")}>
                        <span className="material-symbols-outlined text-[16px] mr-1">rotate_right</span>
                        Rotate CW
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => rotateEditorImage("ccw")}>
                        <span className="material-symbols-outlined text-[16px] mr-1">rotate_left</span>
                        Rotate CCW
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => flipEditorImage("h")}>
                        Flip Horiz
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => flipEditorImage("v")}>
                        Flip Vert
                      </Button>
                    </div>
                  </div>

                  {/* Filters */}
                  <div>
                    <label className="font-metadata text-metadata text-secondary uppercase block mb-2">Enhancement Filter</label>
                    <div className="space-y-1.5">
                      {[
                        { id: "original", label: "Original" },
                        { id: "magic", label: "AI Magic Clean" },
                        { id: "grayscale", label: "Grayscale" },
                        { id: "bw", label: "Black & White" },
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setEditorFilter(f.id as any)}
                          className={`w-full p-2 border text-left text-xs uppercase font-label-bold transition-all ${
                            editorFilter === f.id
                              ? "bg-carbon text-white border-carbon"
                              : "border-outline-variant hover:bg-surface-container-high"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Adjustments */}
                  <div className="space-y-4 pt-2 border-t border-outline-variant">
                    <div>
                      <div className="flex justify-between text-xs font-metadata mb-1">
                        <span>Brightness</span>
                        <span>{editorBrightness > 0 ? `+${editorBrightness}` : editorBrightness}</span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={editorBrightness}
                        onChange={e => setEditorBrightness(parseInt(e.target.value))}
                        className="w-full h-1 bg-surface-container-highest appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-metadata mb-1">
                        <span>Contrast</span>
                        <span>{editorContrast > 0 ? `+${editorContrast}` : editorContrast}</span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={editorContrast}
                        onChange={e => setEditorContrast(parseInt(e.target.value))}
                        className="w-full h-1 bg-surface-container-highest appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-metadata mb-1">
                        <span>Saturation</span>
                        <span>{editorSaturation > 0 ? `+${editorSaturation}` : editorSaturation}</span>
                      </div>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={editorSaturation}
                        onChange={e => setEditorSaturation(parseInt(e.target.value))}
                        className="w-full h-1 bg-surface-container-highest appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-outline-variant space-y-2">
                  <Button variant="carbon" size="lg" className="w-full" onClick={handleSavePageChanges}>
                    Save Page Changes
                  </Button>
                  <Button variant="outline" size="lg" className="w-full" onClick={() => setEditingPageIdx(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : rawFile ? (
            /* Page Grid View */
            <div className="flex-grow overflow-y-auto p-8 bg-surface-container custom-scrollbar">
              {isExtracting ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-4">sync</span>
                  <p className="font-label-bold text-label-bold uppercase">Extracting PDF Pages...</p>
                  <p className="font-metadata text-metadata text-secondary mt-1">Processing layout vectors in browser memory</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {pdfPages.map((page, idx) => (
                    <div key={page.id} className="group relative border border-carbon bg-white p-2 hover:border-primary transition-all flex flex-col justify-between shadow-sm">
                      <div className="relative aspect-[6/8.5] bg-[#f8f9fa] border border-carbon/10 mb-2 overflow-hidden flex items-center justify-center">
                        <img src={page.editedUrl} alt={`Page ${idx + 1}`} className="max-h-full max-w-full object-contain" />
                        <div className="absolute top-1 left-1 bg-carbon text-white text-[9px] px-1.5 py-0.5 font-metadata">
                          PAGE {idx + 1}
                        </div>
                      </div>
                      <div className="flex justify-between items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingPageIdx(idx);
                            setEditorImage(page.originalUrl);
                            setEditorCropRect(page.cropRect || { x: 0, y: 0, width: 1, height: 1 });
                            setEditorRotation(page.rotation);
                            setEditorFilter(page.filter);
                            setEditorBrightness(page.brightness);
                            setEditorContrast(page.contrast);
                            setEditorSaturation(page.saturation);
                            setEditorAspectRatio("free");
                          }}
                          className="py-1.5 px-3 border border-carbon text-[10px] uppercase font-label-bold hover:bg-carbon hover:text-white flex-grow text-center cursor-pointer"
                        >
                          Crop & Edit
                        </button>
                        <div className="flex gap-0.5">
                          <button
                            onClick={() => movePageUp(idx)}
                            disabled={idx === 0}
                            className="p-1 border border-carbon/25 hover:bg-carbon hover:text-white disabled:opacity-30 cursor-pointer flex"
                            title="Move Page Up"
                          >
                            <span className="material-symbols-outlined text-[12px]">arrow_upward</span>
                          </button>
                          <button
                            onClick={() => movePageDown(idx)}
                            disabled={idx === pdfPages.length - 1}
                            className="p-1 border border-carbon/25 hover:bg-carbon hover:text-white disabled:opacity-30 cursor-pointer flex"
                            title="Move Page Down"
                          >
                            <span className="material-symbols-outlined text-[12px]">arrow_downward</span>
                          </button>
                          <button
                            onClick={() => deletePage(idx)}
                            className="p-1 border border-error text-error hover:bg-error hover:text-white cursor-pointer flex"
                            title="Delete Page"
                          >
                            <span className="material-symbols-outlined text-[12px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Upload Dropzone View */
            <div className="flex-grow flex flex-col items-center justify-center bg-surface-container p-8">
              <span className="material-symbols-outlined text-4xl text-secondary mb-4">upload_file</span>
              <p className="font-label-bold text-label-bold uppercase mb-2">Drop PDF document here</p>
              <p className="font-metadata text-metadata text-outline-variant mb-6">Supports PDF files (Up to 50MB)</p>
              <label className="px-6 py-3 bg-carbon text-white uppercase font-metadata text-metadata rounded-full hover:bg-muted-teal transition-all cursor-pointer">
                Browse Files
                <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          )}

          {/* Telemetry Actions bottom sidebar (Visible when compiled results are available) */}
          {pdfResult && (
            <div className="p-6 border-t border-on-surface bg-surface-bright flex flex-col md:flex-row justify-between items-center gap-6 select-none">
              <div className="space-y-1">
                <h3 className="font-label-bold text-xs uppercase text-primary">File Optimization Stats</h3>
                <div className="flex gap-4 font-metadata text-[10px] uppercase text-secondary">
                  <div>Pages: {pdfResult.pagesCount}</div>
                  <div>Original: {rawSizeKb.toFixed(1)} KB</div>
                  <div>Optimized: {pdfResult.sizeKb.toFixed(1)} KB</div>
                  <div className="text-primary font-bold">Ratio: {((1 - pdfResult.blob.size / rawFile!.size) * 100).toFixed(1)}% Saved</div>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <a
                  href={pdfResult.url}
                  download={`optimized_${rawFile?.name}`}
                  className="flex-1 md:flex-none py-3 px-6 bg-muted-teal text-white font-label-bold text-xs uppercase hover:bg-carbon transition-colors text-center"
                >
                  Download PDF
                </a>
                <button
                  onClick={async () => {
                    if (pdfResult && rawFile) {
                      try {
                        const optimizedFile = new File([pdfResult.blob], `optimized_${rawFile.name}`, { type: "application/pdf" });
                        await saveFileToVault(optimizedFile);
                        showToast("Success: Optimized PDF saved to Local Sandbox Vault!", "success");
                      } catch (err) {
                        console.error(err);
                        showToast("Error: Failed to save to local vault.", "error");
                      }
                    }
                  }}
                  className="flex-1 md:flex-none py-3 px-4 border border-carbon text-carbon font-label-bold text-xs uppercase hover:bg-primary hover:text-white transition-all text-center flex items-center justify-center gap-2"
                >
                  Save to Vault
                  <span className="material-symbols-outlined text-[16px]">archive</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
