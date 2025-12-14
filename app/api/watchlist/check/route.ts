import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { isInWatchlistDB } from "@/lib/watchlist-db";
import { isInWatchlist } from "@/lib/watchlist";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get("movieId");
    
    if (!movieId) {
      return NextResponse.json({ error: "Movie ID required" }, { status: 400 });
    }

    if (session?.user?.id) {
      // ログイン済み: データベースから確認
      const isInList = await isInWatchlistDB(session.user.id, parseInt(movieId));
      return NextResponse.json({ isInWatchlist: isInList });
    } else {
      // 未ログイン: ローカルストレージから確認
      const isInList = isInWatchlist(parseInt(movieId));
      return NextResponse.json({ isInWatchlist: isInList });
    }
  } catch (error) {
    console.error("Error checking watchlist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
