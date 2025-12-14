// データベースを使用した見たいリスト管理
import { prisma } from "@/lib/prisma";
import { MovieSearchResult } from "@/types/movie";
import { WatchlistItem } from "./watchlist";

// 見たいリストに追加
export async function addToWatchlistDB(
  userId: string,
  movie: MovieSearchResult
): Promise<boolean> {
  try {
    await prisma.watchlistItem.upsert({
      where: {
        userId_movieId: {
          userId,
          movieId: movie.id,
        },
      },
      update: {
        title: movie.title,
        posterPath: movie.poster_path,
        releaseDate: movie.release_date,
        overview: movie.overview,
        mediaType: movie.media_type,
      },
      create: {
        userId,
        movieId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        releaseDate: movie.release_date,
        overview: movie.overview,
        mediaType: movie.media_type,
      },
    });
    return true;
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    return false;
  }
}

// 見たいリストから削除
export async function removeFromWatchlistDB(
  userId: string,
  movieId: number
): Promise<boolean> {
  try {
    const result = await prisma.watchlistItem.deleteMany({
      where: {
        userId,
        movieId,
      },
    });
    return result.count > 0;
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    return false;
  }
}

// 見たいリストを取得
export async function getWatchlistDB(userId: string): Promise<WatchlistItem[]> {
  const items = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: { addedAt: "desc" },
  });

  return items.map((item) => ({
    id: item.movieId,
    title: item.title,
    poster_path: item.posterPath,
    release_date: item.releaseDate,
    overview: item.overview,
    media_type: (item.mediaType as "movie" | "tv") || "movie",
    added_at: item.addedAt.toISOString(),
  }));
}

// 見たいリストに含まれているかチェック
export async function isInWatchlistDB(
  userId: string,
  movieId: number
): Promise<boolean> {
  const item = await prisma.watchlistItem.findUnique({
    where: {
      userId_movieId: {
        userId,
        movieId,
      },
    },
  });
  return !!item;
}
