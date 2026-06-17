export interface CompressionConfig {
  targetWidth: number;
  targetHeight: number;
  minKb: number;
  maxKb: number;
  mode: "fit" | "crop"; // 'fit' pads borders; 'crop' center-crops
  chromaSubsampling: "4:2:0" | "4:4:4";
}

export interface CompressionResult {
  blob: Blob;
  url: string;
  sizeKb: number;
  width: number;
  height: number;
  quality: number;
  iterations: number;
}

/**
 * Loads a File or Blob as an HTMLImageElement
 */
export function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("IMAGE_LOAD_FAILURE"));
    };
    img.src = url;
  });
}

/**
 * Draw image onto canvas conforming to dimensions and resizing modes (fit vs crop)
 */
export function drawImageToCanvas(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  mode: "fit" | "crop"
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CANVAS_CONTEXT_CREATION_FAILED");

  // Fill white background (government portals typically require solid white/light backdrops)
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  const srcRatio = img.width / img.height;
  const targetRatio = targetWidth / targetHeight;

  if (mode === "crop") {
    // Center-crop source image to match target aspect ratio
    let srcX = 0;
    let srcY = 0;
    let srcW = img.width;
    let srcH = img.height;

    if (srcRatio > targetRatio) {
      srcW = img.height * targetRatio;
      srcX = (img.width - srcW) / 2;
    } else {
      srcH = img.width / targetRatio;
      srcY = (img.height - srcH) / 2;
    }
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetWidth, targetHeight);
  } else {
    // Fit image inside container and pad borders (preserves full image)
    let destWidth = targetWidth;
    let destHeight = targetHeight;
    let destX = 0;
    let destY = 0;

    if (srcRatio > targetRatio) {
      destHeight = targetWidth / srcRatio;
      destY = (targetHeight - destHeight) / 2;
    } else {
      destWidth = targetHeight * srcRatio;
      destX = (targetWidth - destWidth) / 2;
    }
    ctx.drawImage(img, 0, 0, img.width, img.height, destX, destY, destWidth, destHeight);
  }

  return canvas;
}

/**
 * Performs iterative binary search to find target compressed file size
 */
export async function compressImageToTargetSize(
  file: File | Blob,
  config: CompressionConfig
): Promise<CompressionResult> {
  const img = await loadImage(file);
  const canvas = drawImageToCanvas(img, config.targetWidth, config.targetHeight, config.mode);

  let low = 0.01;
  let high = 1.0;
  let bestQuality = 0.8;
  let bestBlob: Blob | null = null;
  let bestDiff = Infinity;
  let iterations = 0;

  const targetSizeKb = (config.minKb + config.maxKb) / 2;

  // Binary search loop
  while (iterations < 12) {
    iterations++;
    const mid = (low + high) / 2;
    
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error("CANVAS_TO_BLOB_FAILED"));
        },
        "image/jpeg",
        mid
      );
    });

    const sizeKb = blob.size / 1024;

    // Check if within bounds
    if (sizeKb >= config.minKb && sizeKb <= config.maxKb) {
      bestBlob = blob;
      bestQuality = mid;
      break; // Found compliant size
    }

    // Keep track of the closest file size we generated in case we don't land perfectly in bounds
    const diff = Math.abs(sizeKb - targetSizeKb);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestBlob = blob;
      bestQuality = mid;
    }

    if (sizeKb > config.maxKb) {
      high = mid; // Compressing further needed (reduce quality)
    } else {
      low = mid; // Larger file size allowed (increase quality)
    }
  }

  if (!bestBlob) {
    throw new Error("COMPRESSION_ALGORITHM_CONVERGENCE_FAILED");
  }

  // Strip EXIF and other APP1-APP15 metadata to satisfy government portals
  let finalBlob = bestBlob;
  try {
    const arrayBuffer = await bestBlob.arrayBuffer();
    const strippedBuffer = stripJpegMetadata(arrayBuffer);
    finalBlob = new Blob([strippedBuffer], { type: "image/jpeg" });
  } catch (err) {
    console.error("EXIF stripping failed:", err);
  }

  return {
    blob: finalBlob,
    url: URL.createObjectURL(finalBlob),
    sizeKb: finalBlob.size / 1024,
    width: config.targetWidth,
    height: config.targetHeight,
    quality: bestQuality,
    iterations,
  };
}

/**
 * Programmatically strips EXIF and ICC profiles (APP1-APP15 segments) from a JPEG buffer.
 * Retains SOI, APP0, SOF, DHT, DQT, SOS, etc., ensuring strict compliance for gov portal uploads.
 */
export function stripJpegMetadata(buffer: ArrayBuffer): ArrayBuffer {
  const view = new DataView(buffer);
  if (view.byteLength < 4) return buffer;
  
  // Verify JPEG SOI (0xFFD8)
  if (view.getUint16(0) !== 0xFFD8) {
    return buffer;
  }

  const chunks: ArrayBuffer[] = [];
  // Add SOI (0xFFD8)
  const soi = new Uint8Array([0xFF, 0xD8]);
  chunks.push(soi.buffer);

  let offset = 2;
  const length = view.byteLength;

  while (offset < length) {
    // Skip padding/alignment bytes that are not 0xFF
    while (offset < length && view.getUint8(offset) !== 0xFF) {
      offset++;
    }
    
    if (offset >= length) break;
    
    // Skip multiple 0xFF pad bytes
    while (offset < length && view.getUint8(offset) === 0xFF) {
      offset++;
    }
    
    if (offset >= length) break;
    
    const marker = view.getUint8(offset);
    offset++; // Advance past marker byte

    // EOI (0xFFD9)
    if (marker === 0xD9) {
      const eoi = new Uint8Array([0xFF, 0xD9]);
      chunks.push(eoi.buffer);
      break;
    }

    // SOS (0xFFDA) - start of scan segment and entropy-coded data. Copy everything to the end.
    if (marker === 0xDA) {
      const sosMarker = new Uint8Array([0xFF, marker]);
      chunks.push(sosMarker.buffer);
      const rest = buffer.slice(offset);
      chunks.push(rest);
      break;
    }

    // Markers without size payload (TEM: 0x01, RST0-RST7: 0xD0-0xD7)
    if (marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) {
      const segment = new Uint8Array([0xFF, marker]);
      chunks.push(segment.buffer);
      continue;
    }

    // Segments with size payload
    if (offset + 2 > length) {
      break;
    }
    
    const segmentLength = view.getUint16(offset);
    if (offset + segmentLength > length) {
      break;
    }

    // If marker is APP1-APP15 (0xE1-0xEF), strip it.
    if (marker >= 0xE1 && marker <= 0xEF) {
      offset += segmentLength;
    } else {
      // Keep segment
      const markerBytes = new Uint8Array([0xFF, marker]);
      chunks.push(markerBytes.buffer);
      const segmentData = buffer.slice(offset, offset + segmentLength);
      chunks.push(segmentData);
      offset += segmentLength;
    }
  }

  // Concatenate chunks
  let totalLength = 0;
  for (const chunk of chunks) {
    totalLength += chunk.byteLength;
  }

  const result = new Uint8Array(totalLength);
  let writeOffset = 0;
  for (const chunk of chunks) {
    result.set(new Uint8Array(chunk), writeOffset);
    writeOffset += chunk.byteLength;
  }

  return result.buffer;
}

