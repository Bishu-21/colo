import { NextResponse } from "next/server";
import { getAggregateStats } from "@/utils/db";

/**
 * GET /api/stats — Public aggregate stats for the website
 * Returns total users, total docs processed, review count, and average rating.
 */
export async function GET() {
  try {
    const stats = await getAggregateStats();

    return NextResponse.json({
      totalUsers: stats.totalUsers,
      totalDocsProcessed: stats.totalDocsProcessed,
      reviewCount: stats.reviewCount,
      avgRating: stats.avgRating,
    });
  } catch (error) {
    console.error("[STATS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "STATS_FETCH_FAILED", details: (error as Error).message },
      { status: 500 }
    );
  }
}
