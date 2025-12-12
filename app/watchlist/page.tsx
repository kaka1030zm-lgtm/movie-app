"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import MovieCard from "../components/MovieCard";
import Toast from "../components/Toast";
import { useTranslation } from "../hooks/useTranslation";
import { MovieSearchResult, WatchlistItem } from "../components/types";
import { Film } from "lucide-react";

const STORAGE_KEY_WATCHLIST = "cinelog_watchlist";

export default function WatchlistPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [watchlistLoading, setWatchlistLoading] = useState<{ [movieId: number]: boolean }>({});

  // ローカルストレージからデータを読み込む
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedWatchlist = localStorage.getItem(STORAGE_KEY_WATCHLIST);
      if (savedWatchlist) {
        setWatchlist(JSON.parse(savedWatchlist));
      }
    } catch (error) {
      console.error("Error loading watchlist:", error);
    }
  }, []);

  // 見たいリストを保存
  useEffect(() => {
    if (watchlist.length > 0 && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(watchlist));
    }
  }, [watchlist]);

  // 簡易的なユーザーID取得
  const getUserId = (): string => {
    if (typeof window === "undefined") return "";
    let userId = localStorage.getItem("cinelog_userId");
    if (!userId) {
      userId = `user_${Date.now()}`;
      localStorage.setItem("cinelog_userId", userId);
    }
    return userId;
  };

  const handleRemoveFromWatchlist = async (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const userId = getUserId();
    if (!userId) {
      setToast({ message: "ログインが必要です", type: "error" });
      return;
    }

    const item = watchlist.find((w) => w.id === id);
    const previousWatchlist = [...watchlist];

    // オプティミスティックUI
    setWatchlist((prev) => prev.filter((item) => item.id !== id));
    setWatchlistLoading((prev) => ({ ...prev, [id]: true }));

    try {
      // APIリクエスト（将来的な実装）
      // const response = await fetch(`/api/watchlist/${id}`, {
      //   method: "DELETE",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ userId }),
      // });
      // if (!response.ok) throw new Error("Failed to remove from watchlist");

      setToast({ 
        message: `「${item?.title || ""}」を見たいリストから削除しました`, 
        type: "info" 
      });
    } catch (error) {
      // エラー時はロールバック
      setWatchlist(previousWatchlist);
      setToast({ 
        message: "操作に失敗しました。ログイン状態を確認してください。", 
        type: "error" 
      });
    } finally {
      setWatchlistLoading((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  const handleMovieClick = (item: WatchlistItem) => {
    // 映画詳細ページに遷移（またはモーダルを開く）
    router.push(`/?movieId=${item.id}`);
  };

  // WatchlistItemをMovieSearchResultに変換
  const convertToMovieSearchResult = (item: WatchlistItem): MovieSearchResult => {
    return {
      id: item.id,
      title: item.title,
      original_title: item.originalTitle,
      name: item.mediaType === "tv" ? item.title : undefined,
      overview: "",
      poster_path: item.posterPath,
      backdrop_path: item.backdropPath,
      release_date: item.releaseDate,
      first_air_date: item.mediaType === "tv" ? item.releaseDate : undefined,
      media_type: item.mediaType,
      vote_average: 0,
    };
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#121212] text-white">
      <Header
        onSearchResults={() => {}}
        onQueryChange={() => {}}
        isLoading={false}
      />
      <main className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">見たいリスト</h1>
          <p className="text-zinc-400">保存した映画・ドラマのリスト</p>
        </div>

        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Film className="mb-4 h-16 w-16 text-zinc-700" />
            <p className="text-xl text-gray-400 mt-4 mb-4">
              見たい映画がありません。検索して追加してください。
            </p>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => router.push("/")}
                className="rounded-lg bg-amber-400 px-6 py-3 font-medium text-black transition-colors hover:bg-amber-300"
              >
                映画を検索
              </button>
              <button
                onClick={() => router.push("/?tab=popular")}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-700"
              >
                人気映画を見る
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
            {watchlist.map((item) => {
              const movie = convertToMovieSearchResult(item);
              return (
                <div key={item.id} className="relative">
                  <MovieCard
                    movie={movie}
                    onClick={() => handleMovieClick(item)}
                    isLoading={false}
                    isInWatchlist={true}
                    onToggleWatchlist={(movie, e) => handleRemoveFromWatchlist(movie.id, e)}
                    isWatchlistLoading={watchlistLoading[item.id] || false}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* トースト通知 */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </main>
    </div>
  );
}
