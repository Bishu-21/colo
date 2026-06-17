import { NextResponse } from "next/server";
import { Jimp, loadFont } from "jimp";
import path from "path";
import crypto from "crypto";
import { 
  saveProcessedImage, 
  saveProcessedFileData, 
  getAllProcessedImages, 
  deleteProcessedImage,
  logWork,
  incrementDocsProcessed,
} from "@/utils/db";
import { stripJpegMetadata } from "@/utils/imageCompressor";
import { getSessionUser } from "@/utils/authConfig";

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { userId, role } = sessionUser;


    // 1. Passive cleanup of older files
    try {
      const allImgs = await getAllProcessedImages();
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      for (const img of allImgs) {
        if (now - img.createdAt > oneHour) {
          await deleteProcessedImage(img.id);
          console.log(`[PASSIVE_CLEANUP] Deleted expired processed image: ${img.id}`);
        }
      }
    } catch (cleanupErr) {
      console.error("[PASSIVE_CLEANUP_ERROR]", cleanupErr);
    }

    // 2. Parse form parameters
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const width = parseInt(formData.get("width") as string || "400");
    const height = parseInt(formData.get("height") as string || "400");
    const mode = (formData.get("mode") as string || "crop") as "fit" | "crop";
    const minKb = parseInt(formData.get("minKb") as string || "10");
    const maxKb = parseInt(formData.get("maxKb") as string || "100");

    if (!file) {
      return NextResponse.json({ error: "NO_FILE_UPLOADED" }, { status: 400 });
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "FILE_TOO_LARGE_MAX_25MB" }, { status: 400 });
    }


    // 3. Load image into Jimp
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const jimpImg = await Jimp.read(buffer);

    const srcRatio = jimpImg.width / jimpImg.height;
    const targetRatio = width / height;

    // 4. Resize and crop/fit
    let processedImg: any;
    if (mode === "crop") {
      let srcW = jimpImg.width;
      let srcH = jimpImg.height;
      let srcX = 0;
      let srcY = 0;

      if (srcRatio > targetRatio) {
        srcW = jimpImg.height * targetRatio;
        srcX = (jimpImg.width - srcW) / 2;
      } else {
        srcH = jimpImg.width / targetRatio;
        srcY = (jimpImg.height - srcH) / 2;
      }
      const cropped = jimpImg.clone().crop({ x: srcX, y: srcY, w: srcW, h: srcH });
      cropped.resize({ w: width, h: height });
      processedImg = cropped;
    } else {
      // Fit mode: Layer resized image centered on white canvas
      const bg = new Jimp({ width, height, color: 0xFFFFFFFF });
      let destW = width;
      let destH = height;
      let destX = 0;
      let destY = 0;

      if (srcRatio > targetRatio) {
        destH = width / srcRatio;
        destY = (height - destH) / 2;
      } else {
        destW = height * srcRatio;
        destX = (width - destW) / 2;
      }
      const resized = jimpImg.clone().resize({ w: destW, h: destH });
      bg.composite(resized, destX, destY);
      processedImg = bg;
    }

    // 5. Binary search compression loop
    let low = 0.01;
    let high = 1.0;
    let bestQuality = 0.8;
    let bestBuffer: Buffer | null = null;
    let bestDiff = Infinity;
    let iterations = 0;
    const targetKb = (minKb + maxKb) / 2;

    while (iterations < 12) {
      iterations++;
      const mid = (low + high) / 2;
      const qVal = Math.round(mid * 100);
      const outBuf = await processedImg.getBuffer("image/jpeg", { quality: qVal });
      const sizeKb = outBuf.length / 1024;

      if (sizeKb >= minKb && sizeKb <= maxKb) {
        bestBuffer = outBuf;
        bestQuality = mid;
        break;
      }

      const diff = Math.abs(sizeKb - targetKb);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestBuffer = outBuf;
        bestQuality = mid;
      }

      if (sizeKb > maxKb) {
        high = mid;
      } else {
        low = mid;
      }
    }

    if (!bestBuffer) {
      throw new Error("COMPRESSION_FAILED");
    }

    // 6. Strip EXIF Metadata from clean JPEG
    let finalCleanBuffer = bestBuffer;
    try {
      const cleanArrayBuffer = bestBuffer.buffer.slice(
        bestBuffer.byteOffset,
        bestBuffer.byteOffset + bestBuffer.byteLength
      );
      const stripped = stripJpegMetadata(cleanArrayBuffer as ArrayBuffer);
      finalCleanBuffer = Buffer.from(stripped);
    } catch (exifErr) {
      console.error("[EXIF_STRIP_ERROR] Failed to strip EXIF on server:", exifErr);
    }

    // 7. Render watermark preview layer
    const textImg = new Jimp({ width, height, color: 0x00000000 });
    const fontPath = path.join(
      process.cwd(),
      "node_modules",
      "@jimp",
      "plugin-print",
      "fonts",
      "open-sans",
      "open-sans-16-black",
      "open-sans-16-black.fnt"
    );
    const font = await loadFont(fontPath);

    const stepX = 120;
    const stepY = 80;
    for (let x = 10; x < width; x += stepX) {
      for (let y = 15; y < height; y += stepY) {
        textImg.print({ font, x, y, text: "MORPEE VERIFIED" });
      }
    }
    textImg.opacity(0.22);

    const wmImg = processedImg.clone();
    wmImg.composite(textImg, 0, 0);
    const wmBuffer = await wmImg.getBuffer("image/jpeg", { quality: 80 });

    // 8. Determine user and check if PRO
    const isPro = role === "operator" || role === "enterprise";

    // 9. Create metadata record and cache buffers
    const imageId = crypto.randomUUID();
    saveProcessedFileData(imageId, "clean", finalCleanBuffer);
    saveProcessedFileData(imageId, "wm", wmBuffer);

    await saveProcessedImage({
      id: imageId,
      userId,
      filename: file.name,
      isPaid: isPro, // Pro unlocks download instantly
      createdAt: Date.now(),
      sizeKb: finalCleanBuffer.length / 1024,
      width,
      height,
    });

    // 10. Log work and increment user doc count
    try {
      await logWork({
        userId,
        documentType: "photo",
        originalFilename: file.name,
        outputSizeKb: finalCleanBuffer.length / 1024,
        outputWidth: width,
        outputHeight: height,
      });
      if (userId !== "guest_user") {
        await incrementDocsProcessed(userId);
      }
    } catch (logErr) {
      console.error("[WORK_LOG_ERROR]", logErr);
    }

    const previewBase64 = wmBuffer.toString("base64");

    return NextResponse.json({
      id: imageId,
      sizeKb: finalCleanBuffer.length / 1024,
      width,
      height,
      previewUrl: `data:image/jpeg;base64,${previewBase64}`,
      isPaid: isPro,
    });
  } catch (error) {
    const err = error as Error;
    console.error("[IMAGE_PROCESS_ROUTE_ERROR]", err);
    return NextResponse.json(
      { error: "IMAGE_PROCESS_FAILED", details: err.message },
      { status: 500 }
    );
  }
}
