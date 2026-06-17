import { NextResponse } from "next/server";
import { getProcessedImage, getProcessedFileData } from "@/utils/db";

import { getSessionUser } from "@/utils/authConfig";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "IMAGE_ID_REQUIRED" }, { status: 400 });
    }

    const image = await getProcessedImage(id);
    if (!image) {
      return NextResponse.json({ error: "IMAGE_NOT_FOUND" }, { status: 404 });
    }

    // Decode session payload and enforce ownership
    let userId = "guest_user";
    const sessionUser = await getSessionUser();
    if (sessionUser) {
      userId = sessionUser.userId;
    }

    if (image.userId !== "guest_user" && image.userId.toLowerCase() !== userId.toLowerCase()) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    // Verify if paid or unlocked
    if (!image.isPaid) {
      return NextResponse.json({ error: "PAYMENT_REQUIRED_TO_DOWNLOAD" }, { status: 402 });
    }


    const cleanBuffer = getProcessedFileData(id, "clean");
    if (!cleanBuffer) {
      return NextResponse.json({ error: "OPTIMIZED_FILE_NOT_FOUND_IN_CACHE" }, { status: 404 });
    }

    // Stream JPEG content to browser
    return new Response(new Uint8Array(cleanBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="optimized_${image.filename.split(".")[0]}.jpg"`,
        "Content-Length": cleanBuffer.length.toString(),
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error("[IMAGE_DOWNLOAD_ROUTE_ERROR]", err);
    return NextResponse.json(
      { error: "IMAGE_DOWNLOAD_FAILED", details: err.message },
      { status: 500 }
    );
  }
}
