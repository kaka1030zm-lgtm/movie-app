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
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-white to-[#d4af37] bg-clip-text text-transparent tracking-tight mb-3">
            見たいリスト
          </h1>
          <p className="text-white/50 font-medium">保存した映画・ドラマのリスト</p>
        </div>

        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 relative">
              <Film className="h-20 w-20 text-white/10" />
              <div className="absolute inset-0 bg-[#d4af37]/10 blur-2xl"></div>
            </div>
            <p className="text-xl text-white/60 font-semibold mt-4 mb-6">
              見たい映画がありません。検索して追加してください。
            </p>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => router.push("/")}
                className="rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f4d03f] px-8 py-4 font-semibold text-black transition-all duration-300 hover:from-[#f4d03f] hover:to-[#d4af37] shadow-lg shadow-[#d4af37]/20 hover:shadow-[#d4af37]/30 hover:scale-105"
              >
                映画を検索
              </button>
              <button
                onClick={() => router.push("/?tab=popular")}
                className="rounded-xl border border-white/20 bg-white/5 px-8 py-4 font-semibold text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105"
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
