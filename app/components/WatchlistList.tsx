"use client";

import { useState, useMemo } from "react";
import { Film, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { WatchlistItem } from "@/lib/watchlist";
import { getPosterUrl } from "@/lib/tmdb";

interface WatchlistListProps {
  watchlist: WatchlistItem[];
  onMovieSelect: (movie: WatchlistItem, event?: React.MouseEvent) => void;
  onRemove: (movieId: number) => void;
}

type SortField = "title" | "date" | "release_date";
type SortOrder = "asc" | "desc";

export default function WatchlistList({
  watchlist,
  onMovieSelect,
  onRemove,
}: WatchlistListProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAndSortedWatchlist = useMemo(() => {
    // 検索フィルター
    let filtered = [...watchlist];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(query) ||
        (item.overview && item.overview.toLowerCase().includes(query))
      );
    }

    // ソート
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "date":
          aValue = new Date(a.added_at).getTime();
          bValue = new Date(b.added_at).getTime();
          break;
        case "release_date":
          aValue = a.release_date ? new Date(a.release_date).getTime() : 0;
          bValue = b.release_date ? new Date(b.release_date).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" 
          ? aValue.localeCompare(bValue, "ja")
          : bValue.localeCompare(aValue, "ja");
      } else {
        return sortOrder === "asc" 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });
    return sorted;
  }, [watchlist, sortField, sortOrder, searchQuery]);

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div>
      {/* 検索バー */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="見たいリストを検索..."
            className="w-full h-12 pl-12 pr-4 rounded-full border border-[#1a1a1a] bg-[#0a0a0a] text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
          />
        </div>
      </div>

      {watchlist.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">見たいリストが空です</p>
          <p className="text-gray-500 text-sm mt-2">映画を検索して追加しましょう</p>
        </div>
      ) : filteredAndSortedWatchlist.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">検索結果が見つかりませんでした</p>
        </div>
      ) : (
        <>
          {/* ソート機能 */}
          <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">並び替え:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { field: "title" as SortField, label: "名前" },
            { field: "date" as SortField, label: "追加日" },
            { field: "release_date" as SortField, label: "公開年" },
          ].map(({ field, label }) => (
            <button
              key={field}
              onClick={() => handleSortChange(field)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                sortField === field
                  ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]"
                  : "bg-[#0a0a0a] border-[#1a1a1a] text-gray-400 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
              }`}
            >
              <span className="text-sm font-medium">{label}</span>
              {sortField === field && (
                sortOrder === "asc" ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )
              )}
            </button>
          ))}
        </div>
      </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6 overflow-visible">
            {filteredAndSortedWatchlist.map((item) => {
          const posterUrl = getPosterUrl(item.poster_path);
          return (
          <div
            key={item.id}
            className="group/watchlist flex flex-col h-full overflow-visible rounded-lg transition-all duration-300"
            style={{ transform: "translateZ(0)" }}
          >
          <div className="relative flex flex-col h-full overflow-visible rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] transition-all duration-200 group-hover/watchlist:scale-[1.03] group-hover/watchlist:border-[#D4AF37]/60 group-hover/watchlist:shadow-xl group-hover/watchlist:shadow-[#D4AF37]/20 group-hover/watchlist:z-10">
            {/* 画像エリア */}
            <div 
              className="relative w-full aspect-[2/3] overflow-hidden rounded-t-lg flex-shrink-0 cursor-pointer"
              onClick={(e) => onMovieSelect(item, e)}
            >
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={item.title}
                  className="object-cover w-full h-full transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-[#2a2a2a] flex flex-col items-center justify-center">
                  <Film className="h-8 w-8 text-gray-600 mb-2" />
                  <p className="text-xs text-gray-500 text-center px-2 line-clamp-2">
                    {item.release_date
                      ? `${item.title} 【${new Date(item.release_date).getFullYear()}】`
                      : item.title}
                  </p>
                </div>
              )}

            </div>

            {/* テキストエリア */}
            <div className="flex-1 p-4 flex flex-col">
              <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">
                {item.release_date
                  ? `${item.title} 【${new Date(item.release_date).getFullYear()}】`
                  : item.title}
              </h3>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(item.added_at).toLocaleDateString("ja-JP")} に追加
              </p>
            </div>
          </div>
          </div>
          );
        })}
          </div>
        </>
      )}
    </div>
  );
}


