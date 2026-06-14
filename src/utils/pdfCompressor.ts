import { PDFDocument } from "pdf-lib";

export interface PDFCompressionConfig {
  targetDpi: number; // e.g. 150 DPI
  quality: number; // JPEG export quality (0.01 - 1.0)
  stripMetadata: boolean;
}

export interface PDFCompressionResult {
  blob: Blob;
  url: string;
  sizeKb: number;
  pagesCount: number;
}

/**
 * Converts a data URL (base64) to an ArrayBuffer
 */
function dataURLToArrayBuffer(dataURL: string): ArrayBuffer {
  const base64 = dataURL.split(",")[1];
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Compresses PDF client-side by rasterizing pages at a specific DPI and compiling to JPEG.
 * This also strips metadata by creating a new document container.
 */
export async function compressPdf(
  file: File,
  config: PDFCompressionConfig
): Promise<PDFCompressionResult> {
  const arrayBuffer = await file.arrayBuffer();

  // Dynamically import pdfjs-dist inside the browser-only context
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  // Load PDF document using PDF.js
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  const pagesCount = pdf.numPages;

  // Create new PDF document container
  const outputPdf = await PDFDocument.create();

  // Strip metadata if enabled (creating a new container implicitly does this, but we also ensure no headers remain)
  if (config.stripMetadata) {
    outputPdf.setTitle("");
    outputPdf.setAuthor("");
    outputPdf.setSubject("");
    outputPdf.setKeywords([]);
    outputPdf.setProducer("");
    outputPdf.setCreator("");
  }

  // Loop through pages and render them to canvas
  for (let i = 1; i <= pagesCount; i++) {
    const page = await pdf.getPage(i);

    // Default PDF resolution is 72 DPI. So scale is targetDpi / 72.
    const scale = config.targetDpi / 72;
    const viewport = page.getViewport({ scale });
    const originalViewport = page.getViewport({ scale: 1 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("CANVAS_CONTEXT_CREATION_FAILED");

    // Fill white background for clear contrast
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render page to canvas context
    const renderContext = {
      canvasContext: ctx,
      viewport,
      canvas,
    };
    await page.render(renderContext).promise;

    // Convert canvas page render to compressed JPEG bytes
    const jpegDataUrl = canvas.toDataURL("image/jpeg", config.quality);
    const jpegBytes = new Uint8Array(dataURLToArrayBuffer(jpegDataUrl));

    // Embed compressed page image into new PDF document
    const embeddedImage = await outputPdf.embedJpg(jpegBytes);

    // Create a page matching original dimensions to preserve physical print size
    const newPage = outputPdf.addPage([originalViewport.width, originalViewport.height]);
    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height,
    });
  }

  const outputBytes = await outputPdf.save();
  const outputBlob = new Blob([outputBytes as any], { type: "application/pdf" });

  return {
    blob: outputBlob,
    url: URL.createObjectURL(outputBlob),
    sizeKb: outputBlob.size / 1024,
    pagesCount,
  };
}
