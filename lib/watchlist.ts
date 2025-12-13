// 見たいリスト管理のユーティリティ
import { MovieSearchResult } from "@/types/movie";

const STORAGE_KEY = "movie_ratings_watchlist";

export interface WatchlistItem {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  overview: string | null;
  media_type?: "movie" | "tv";
  added_at: string;
}

// 見たいリストに追加
export function addToWatchlist(movie: MovieSearchResult): boolean {
  if (typeof window === "undefined") return false;

  try {
    const watchlist = getWatchlist();
    
    // 既に追加されているかチェック
    if (watchlist.some((item) => item.id === movie.id)) {
      return false; // 既に存在
    }

    const newItem: WatchlistItem = {
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      overview: movie.overview,
      media_type: movie.media_type,
      added_at: new Date().toISOString(),
    };

    watchlist.push(newItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
    return true;
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    return false;
  }
}

// 見たいリストから削除
export function removeFromWatchlist(movieId: number): boolean {
  if (typeof window === "undefined") return false;

  try {
    const watchlist = getWatchlist();
    const filtered = watchlist.filter((item) => item.id !== movieId);

    if (filtered.length === watchlist.length) {
      return false; // 見つからなかった
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    return false;
  }
}

// 見たいリストを取得
export function getWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error loading watchlist:", error);
    return [];
  }
}

// 見たいリストに含まれているかチェック
export function isInWatchlist(movieId: number): boolean {
  const watchlist = getWatchlist();
  return watchlist.some((item) => item.id === movieId);
}
