import { NextResponse } from "next/server";
import { 
  getProcessedImage, 
  saveProcessedImage,
  deductUserCredit
} from "@/utils/db";
import { getSessionUser } from "@/utils/authConfig";

export async function POST(request: Request) {
  try {
    const { imageId } = await request.json();

    if (!imageId) {
      return NextResponse.json({ error: "IMAGE_ID_REQUIRED" }, { status: 400 });
    }

    const image = await getProcessedImage(imageId);
    if (!image) {
      return NextResponse.json({ error: "IMAGE_NOT_FOUND" }, { status: 404 });
    }

    // Decode session payload and enforce authentication
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { userId, role } = sessionUser;

    let currentCredits = 0;
    let currentRole = role;

    // Fetch credits and role from DB
    const { getUser } = await import("@/utils/db");
    const dbUser = await getUser(userId);
    if (dbUser) {
      currentCredits = dbUser.credits;
      currentRole = dbUser.role;
    }

    // Ownership check: Verify user owns the image they want to unlock
    if (image.userId.toLowerCase() !== userId.toLowerCase()) {
      return NextResponse.json({ error: "FORBIDDEN_OWNERSHIP_MISMATCH" }, { status: 403 });
    }



    // If image is already paid, just return success
    if (image.isPaid) {
      return NextResponse.json({ success: true, isPaid: true, credits: currentCredits });
    }

    // If role is pro/operator/enterprise, unlock automatically
    if (currentRole === "operator" || currentRole === "enterprise") {
      image.isPaid = true;
      await saveProcessedImage(image);
      return NextResponse.json({ success: true, isPaid: true, credits: currentCredits });
    }

    // For standard users, deduct 1 credit
    let updatedCredits = currentCredits;

    const isGuest = userId.startsWith("guest_") || userId === "guest_user";

    if (!isGuest) {
      // Authenticated User
      try {
        updatedCredits = await deductUserCredit(userId);
      } catch (err: any) {
        if (err.message === "INSUFFICIENT_CREDITS_OR_USER_NOT_FOUND") {
          return NextResponse.json({ error: "INSUFFICIENT_CREDITS" }, { status: 402 });
        }
        throw err;
      }
    } else {
      // Guest User (uses cookie credits)
      if (currentCredits < 1) {
        return NextResponse.json({ error: "INSUFFICIENT_CREDITS" }, { status: 402 });
      }
      updatedCredits = currentCredits - 1;
    }

    // Set image as unlocked
    image.isPaid = true;
    await saveProcessedImage(image);

    return NextResponse.json({
      success: true,
      isPaid: true,
      credits: updatedCredits,
    });
  } catch (error) {
    const err = error as Error;
    console.error("[IMAGE_UNLOCK_ROUTE_ERROR]", err);
    return NextResponse.json(
      { error: "IMAGE_UNLOCK_FAILED", details: err.message },
      { status: 500 }
    );
  }
}
