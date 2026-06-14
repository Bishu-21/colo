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

  return {
    blob: bestBlob,
    url: URL.createObjectURL(bestBlob),
    sizeKb: bestBlob.size / 1024,
    width: config.targetWidth,
    height: config.targetHeight,
    quality: bestQuality,
    iterations,
  };
}
