import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import {
  getWatchlistDB,
  addToWatchlistDB,
  removeFromWatchlistDB,
  isInWatchlistDB,
} from "@/lib/watchlist-db";
import { MovieSearchResult } from "@/types/movie";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const watchlist = await getWatchlistDB(session.user.id);
    return NextResponse.json(watchlist);
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const movie: MovieSearchResult = await request.json();
    const success = await addToWatchlistDB(session.user.id, movie);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    const success = await removeFromWatchlistDB(session.user.id, parseInt(movieId));
    return NextResponse.json({ success });
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
