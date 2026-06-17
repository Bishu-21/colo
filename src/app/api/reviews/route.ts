import { NextResponse } from "next/server";
import { getSessionUser } from "@/utils/authConfig";
import { addReview, getReviews, getReviewStats, checkRateLimit } from "@/utils/db";

/**
 * POST /api/reviews — Submit a new review
 */
export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const { userId } = sessionUser;


    // Rate limiting: 5 reviews per hour (3600 seconds)
    const isLimited = await checkRateLimit(`reviews:${userId}`, 5, 3600);
    if (isLimited) {
      return NextResponse.json({ error: "TOO_MANY_REQUESTS" }, { status: 429 });
    }

    const { rating, reviewText, displayName } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "RATING_REQUIRED_1_TO_5" },
        { status: 400 }
      );
    }


    const finalUserId = userId === "guest_user" ? undefined : userId;

    await addReview({
      userId: finalUserId,
      rating: Math.round(rating),
      reviewText: reviewText?.trim() || undefined,
      displayName: displayName?.trim() || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[REVIEW_POST_ERROR]", error);
    return NextResponse.json(
      { error: "REVIEW_SUBMIT_FAILED", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews — Fetch reviews and aggregate stats
 */
export async function GET() {
  try {
    const [reviews, stats] = await Promise.all([
      getReviews(),
      getReviewStats(),
    ]);

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        reviewText: r.review_text,
        displayName: r.display_name || "Anonymous",
        createdAt: r.created_at,
      })),
      stats,
    });
  } catch (error) {
    console.error("[REVIEW_GET_ERROR]", error);
    return NextResponse.json(
      { error: "REVIEW_FETCH_FAILED", details: (error as Error).message },
      { status: 500 }
    );
  }
}
