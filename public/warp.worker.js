/**
 * Background Web Worker for COLO
 * Performs Bilinear Inverse Perspective Warp mapping and high-performance
 * image cleaning filters (Magic Clean, Grayscale, B&W) without blocking the React main thread.
 */
self.onmessage = function (e) {
  const {
    srcData,
    imgW,
    imgH,
    cropPoints,
    targetW,
    targetH,
    filterMode
  } = e.data;

  // Create destination pixel buffer
  const destData = new Uint8ClampedArray(targetW * targetH * 4);

  // Extract relative corner coordinates to absolute pixels
  const x0 = cropPoints[0].x * imgW;
  const y0 = cropPoints[0].y * imgH;
  const x1 = cropPoints[1].x * imgW;
  const y1 = cropPoints[1].y * imgH;
  const x2 = cropPoints[2].x * imgW;
  const y2 = cropPoints[2].y * imgH;
  const x3 = cropPoints[3].x * imgW;
  const y3 = cropPoints[3].y * imgH;

  // Loop through destination canvas pixels and compute inverse bilinear map
  for (let v = 0; v < targetH; v++) {
    const q = v / targetH; // vertical relative coord
    for (let u = 0; u < targetW; u++) {
      const p = u / targetW; // horizontal relative coord

      // Bilinear Interpolation Formula
      const srcX = Math.round(
        (1 - p) * (1 - q) * x0 +
        p * (1 - q) * x1 +
        p * q * x2 +
        (1 - p) * q * x3
      );
      const srcY = Math.round(
        (1 - p) * (1 - q) * y0 +
        p * (1 - q) * y1 +
        p * q * y2 +
        (1 - p) * q * y3
      );

      // Boundaries clamp check
      if (srcX >= 0 && srcX < imgW && srcY >= 0 && srcY < imgH) {
        const srcIdx = (srcY * imgW + srcX) * 4;
        const destIdx = (v * targetW + u) * 4;

        let r = srcData[srcIdx];
        let g = srcData[srcIdx + 1];
        let b = srcData[srcIdx + 2];
        const a = srcData[srcIdx + 3];

        // Apply Document Cleaning Filters (Magic Clean, Grayscale, B&W)
        if (filterMode === "grayscale") {
          const y = 0.299 * r + 0.587 * g + 0.114 * b;
          r = g = b = y;
        } else if (filterMode === "bw") {
          const y = 0.299 * r + 0.587 * g + 0.114 * b;
          const val = y > 128 ? 255 : 0;
          r = g = b = val;
        } else if (filterMode === "magic") {
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

        destData[destIdx] = r;
        destData[destIdx + 1] = g;
        destData[destIdx + 2] = b;
        destData[destIdx + 3] = a;
      }
    }
  }

  // Transfer pixel data back using Transferable Objects
  self.postMessage({ destData }, [destData.buffer]);
};
