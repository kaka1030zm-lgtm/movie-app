"use client";

import { Star, Film, Trash2 } from "lucide-react";
import { WatchlistItem } from "@/lib/watchlist";
import { getPosterUrl } from "@/lib/tmdb";

interface WatchlistListProps {
  watchlist: WatchlistItem[];
  onMovieSelect: (movie: WatchlistItem) => void;
  onRemove: (movieId: number) => void;
}

export default function WatchlistList({
  watchlist,
  onMovieSelect,
  onRemove,
}: WatchlistListProps) {
  if (watchlist.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">見たいリストが空です</p>
        <p className="text-gray-500 text-sm mt-2">映画を検索して追加しましょう</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {watchlist.map((item) => {
        const posterUrl = getPosterUrl(item.poster_path);
        return (
          <div
            key={item.id}
            className="group flex flex-col h-full overflow-hidden rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#D4AF37]/50 transition-all duration-300"
          >
            {/* 画像エリア */}
            <button
              onClick={() => onMovieSelect(item)}
              className="relative w-full aspect-[2/3] overflow-hidden rounded-t-lg transition-transform duration-500 group-hover:scale-105"
            >
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={item.title}
                  className="object-cover w-full h-full transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-[#2a2a2a] flex flex-col items-center justify-center">
                  <Film className="h-8 w-8 text-gray-600 mb-2" />
                  <p className="text-xs text-gray-500 text-center px-2 line-clamp-2">
                    {item.title}
                  </p>
                </div>
              )}

              {/* 削除ボタン */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("見たいリストから削除しますか？")) {
                    onRemove(item.id);
                  }
                }}
                className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full p-2 hover:bg-red-500/90 transition-colors opacity-0 group-hover:opacity-100"
                title="削除"
              >
                <Trash2 className="h-4 w-4 text-white" />
              </button>
            </button>

            {/* テキストエリア */}
            <div className="flex-1 p-4 flex flex-col">
              <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">
                {item.title}
              </h3>
              {item.release_date && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(item.release_date).getFullYear()}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {new Date(item.added_at).toLocaleDateString("ja-JP")} に追加
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
