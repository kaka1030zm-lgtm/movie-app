"use client";

import { useState, useMemo } from "react";
import { Star, Film, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { Review } from "@/types/movie";
import { getPosterUrl } from "@/lib/tmdb";

interface ReviewListProps {
  reviews: Review[];
  onEdit: (review: Review) => void;
  onDelete: (reviewId: string) => void;
  onMovieClick?: (review: Review, event?: React.MouseEvent) => void;
}

type SortField = "title" | "story" | "acting" | "direction" | "cinematography" | "music" | "overall" | "date";
type SortOrder = "asc" | "desc";

export default function ReviewList({ reviews, onEdit, onDelete, onMovieClick }: ReviewListProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAndSortedReviews = useMemo(() => {
    // 検索フィルター
    let filtered = [...reviews];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((review) =>
        review.movie_title.toLowerCase().includes(query) ||
        (review.comment && review.comment.toLowerCase().includes(query))
      );
    }

    // ソート
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case "title":
          aValue = a.movie_title.toLowerCase();
          bValue = b.movie_title.toLowerCase();
          break;
        case "story":
          aValue = a.ratings.story;
          bValue = b.ratings.story;
          break;
        case "acting":
          aValue = a.ratings.acting;
          bValue = b.ratings.acting;
          break;
        case "direction":
          aValue = a.ratings.direction;
          bValue = b.ratings.direction;
          break;
        case "cinematography":
          aValue = a.ratings.cinematography;
          bValue = b.ratings.cinematography;
          break;
        case "music":
          aValue = a.ratings.music;
          bValue = b.ratings.music;
          break;
        case "overall":
          aValue = a.overall_star_rating;
          bValue = b.overall_star_rating;
          break;
        case "date":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
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
  }, [reviews, sortField, sortOrder, searchQuery]);

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
            placeholder="レビューを検索..."
            className="w-full h-12 pl-12 pr-4 rounded-full border border-[#1a1a1a] bg-[#0a0a0a] text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
          />
        </div>
      </div>

      {/* ソート機能 */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">並び替え:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { field: "title" as SortField, label: "名前" },
            { field: "story" as SortField, label: "ストーリー" },
            { field: "acting" as SortField, label: "演技" },
            { field: "direction" as SortField, label: "演出" },
            { field: "cinematography" as SortField, label: "映像美" },
            { field: "music" as SortField, label: "音楽" },
            { field: "overall" as SortField, label: "総合評価" },
            { field: "date" as SortField, label: "作成日" },
          ].map(({ field, label }) => (
            <button
              key={field}
              onClick={() => handleSortChange(field)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                sortField === field
                  ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30"
                  : "bg-[#0a0a0a] text-gray-300 border border-[#1a1a1a] hover:border-[#D4AF37]/50"
              }`}
            >
              {label}
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

      {filteredAndSortedReviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">
            {searchQuery.trim() ? "検索結果が見つかりませんでした" : "まだレビューがありません"}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-400">
            {filteredAndSortedReviews.length}件のレビュー
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 overflow-visible">
            {filteredAndSortedReviews.map((review) => {
              const posterUrl = getPosterUrl(review.movie_poster_path);
              return (
                <div
            key={review.id}
            className="group/review flex flex-col h-full overflow-visible rounded-lg transition-all duration-300"
            style={{ transform: "translateZ(0)" }}
          >
            <div className="relative flex flex-col h-full overflow-visible rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] transition-all duration-200 group-hover/review:scale-[1.03] group-hover/review:border-[#D4AF37]/60 group-hover/review:shadow-xl group-hover/review:shadow-[#D4AF37]/20 group-hover/review:z-10">
            {/* 画像エリア */}
            <div 
              className="relative w-full aspect-[2/3] overflow-hidden rounded-t-lg flex-shrink-0 cursor-pointer"
              onClick={(e) => onMovieClick && onMovieClick(review, e)}
            >
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={review.movie_title}
                  className="object-cover w-full h-full transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-[#2a2a2a] flex flex-col items-center justify-center">
                  <Film className="h-8 w-8 text-gray-600 mb-2" />
                  <p className="text-xs text-gray-500 text-center px-2 line-clamp-2">
                    {review.movie_release_date
                      ? `${review.movie_title} 【${new Date(review.movie_release_date).getFullYear()}】`
                      : review.movie_title}
                  </p>
                </div>
              )}

              {/* 星評価バッジ */}
              <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 z-10">
                <Star className="h-3.5 w-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                <span className="text-xs font-semibold text-white">
                  {review.overall_star_rating.toFixed(1)}
                </span>
              </div>

            </div>

            {/* テキストエリア */}
            <div className="flex-1 p-4 flex flex-col min-h-[120px]">
              <h3 className="text-sm sm:text-base font-semibold text-white mb-2 line-clamp-2 min-h-[2.5rem]">
                {review.movie_release_date
                  ? `${review.movie_title} 【${new Date(review.movie_release_date).getFullYear()}】`
                  : review.movie_title}
              </h3>

              {/* 評価項目の表示 */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">ストーリー</span>
                  <span className="text-[#D4AF37]">{review.ratings.story}/10</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">演技</span>
                  <span className="text-[#D4AF37]">{review.ratings.acting}/10</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">演出</span>
                  <span className="text-[#D4AF37]">{review.ratings.direction}/10</span>
                </div>
              </div>

              {review.comment && (
                <p className="text-sm text-gray-300 line-clamp-3 mt-auto">
                  {review.comment}
                </p>
              )}

              <p className="text-xs text-gray-500 mt-3">
                {new Date(review.created_at).toLocaleDateString("ja-JP")}
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


