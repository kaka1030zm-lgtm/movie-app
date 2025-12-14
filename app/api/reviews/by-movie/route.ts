import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { getReviewByMovieIdDB } from "@/lib/reviews-db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get("movieId");
    if (!movieId) {
      return NextResponse.json({ error: "Movie ID required" }, { status: 400 });
    }

    const review = await getReviewByMovieIdDB(session.user.id, parseInt(movieId));
    return NextResponse.json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
