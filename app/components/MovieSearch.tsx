"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Film, Filter, Clock, ArrowUpDown, ChevronDown, Sparkles, Trash2, Tv, Monitor } from "lucide-react";
import { MovieSearchResult } from "@/types/movie";
import { searchMulti, getGenres, getPopularMovies, getWatchProviders, getMovieDetails, TMDBProvider } from "@/lib/tmdb";

interface MovieSearchProps {
  onMovieSelect: (movie: MovieSearchResult, event?: React.MouseEvent) => void;
  onSearchStateChange?: (hasResults: boolean) => void;
}

export default function MovieSearch({ onMovieSelect, onSearchStateChange }: MovieSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [displayedResults, setDisplayedResults] = useState<MovieSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<"all" | "movie" | "tv">("all");
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [watchProviders, setWatchProviders] = useState<TMDBProvider[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"popularity" | "rating" | "date">("popularity");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [recommendedMovies, setRecommendedMovies] = useState<MovieSearchResult[]>([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ジャンル一覧を取得
  useEffect(() => {
    getGenres("movie")
      .then((data) => setGenres(data))
      .catch((error) => {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching genres:", error);
        }
      });
  }, []);

  // 配信プロバイダー一覧を取得
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const [movieProviders, tvProviders] = await Promise.all([
          getWatchProviders("movie"),
          getWatchProviders("tv"),
        ]);
        // 両方のプロバイダーをマージして重複を除去
        const allProviders = [...movieProviders, ...tvProviders];
        const uniqueProviders = allProviders.filter(
          (provider, index, self) =>
            index === self.findIndex((p) => p.provider_id === provider.provider_id)
        );
        setWatchProviders(uniqueProviders);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching watch providers:", error);
        }
      }
    };
    loadProviders();
  }, []);

  // 検索履歴を読み込む
  useEffect(() => {
    if (typeof window !== "undefined") {
      const history = localStorage.getItem("movieSearchHistory");
      if (history) {
        try {
          const parsed = JSON.parse(history);
          setSearchHistory(Array.isArray(parsed) ? parsed.slice(0, 5) : []);
        } catch (e) {
          if (process.env.NODE_ENV === "development") {
            console.error("Error parsing search history:", e);
          }
        }
      }
    }
  }, []);

  // 検索履歴を保存
  const saveToHistory = (searchQuery: string) => {
    if (!searchQuery.trim() || typeof window === "undefined") return;
    const trimmed = searchQuery.trim();
    const updated = [trimmed, ...searchHistory.filter((h) => h !== trimmed)].slice(0, 5);
    setSearchHistory(updated);
    localStorage.setItem("movieSearchHistory", JSON.stringify(updated));
  };

  // 検索履歴から特定の項目を削除
  const removeFromHistory = (itemToRemove: string) => {
    if (typeof window === "undefined") return;
    const updated = searchHistory.filter((h) => h !== itemToRemove);
    setSearchHistory(updated);
    localStorage.setItem("movieSearchHistory", JSON.stringify(updated));
  };

  // 検索履歴を一括削除
  const clearAllHistory = () => {
    if (typeof window === "undefined") return;
    setSearchHistory([]);
    localStorage.removeItem("movieSearchHistory");
  };

  // おすすめ映画を読み込む
  const loadRecommendedMovies = async () => {
    setIsLoadingRecommended(true);
    try {
      const movies = await getPopularMovies();
      const recommended = movies.slice(0, 10).map((movie) => ({
        id: movie.id,
        title: movie.title || movie.name || "",
        poster_path: movie.poster_path,
        release_date: movie.release_date || movie.first_air_date || null,
        overview: movie.overview,
        vote_average: movie.vote_average,
        popularity: movie.popularity,
        genres: movie.genres,
        media_type: movie.media_type as "movie" | "tv",
      }));
      setRecommendedMovies(recommended);
    } catch (error) {
      console.error("Error loading recommended movies:", error);
    } finally {
      setIsLoadingRecommended(false);
    }
  };

  // 検索窓にフォーカスしたとき
  const handleFocus = () => {
    setShowHistory(true);
    if (recommendedMovies.length === 0 && !isLoadingRecommended) {
      loadRecommendedMovies();
    }
  };

  // 検索窓からフォーカスが外れたとき
  const handleBlur = (e: React.FocusEvent) => {
    // ドロップダウン内をクリックした場合は閉じない
    if (dropdownRef.current && dropdownRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    setTimeout(() => {
      setShowHistory(false);
    }, 200);
  };

  // 検索のデバウンス処理
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      if (onSearchStateChange) {
        onSearchStateChange(false);
      }
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      await performSearch(query);
      saveToHistory(query);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, selectedGenre, selectedYear, sortBy]);

  const performSearch = async (searchQuery: string, page: number = 1, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setCurrentPage(1);
    }

    try {
      // 50件表示するため、複数ページを取得（1ページ20件なので3ページ分）
      const pagesToFetch = Math.ceil((page * 50) / 20);
      const startPage = append ? Math.floor((currentPage * 50) / 20) + 1 : 1;
      const endPage = pagesToFetch;

      const allResults: MovieSearchResult[] = [];
      let totalPagesCount = 1;

      for (let p = startPage; p <= endPage; p++) {
        const response = await searchMulti(searchQuery, p, selectedGenre || undefined, selectedYear || undefined);
        
        if (response.results) {
          totalPagesCount = response.total_pages;
          
          // 映画とTVのみをフィルター（personを除外）
          let filtered = response.results
            .filter((item) => item.media_type === "movie" || item.media_type === "tv")
            .map((movie) => ({
              id: movie.id,
              title: movie.title || movie.name || "",
              poster_path: movie.poster_path,
              release_date: movie.release_date || movie.first_air_date || null,
              overview: movie.overview,
              vote_average: movie.vote_average,
              popularity: movie.popularity,
              genres: movie.genres,
              media_type: movie.media_type as "movie" | "tv",
            }));

          // 媒体タイプでフィルター
          if (selectedMediaType !== "all") {
            filtered = filtered.filter((item) => item.media_type === selectedMediaType);
          }

          allResults.push(...filtered);
        }
      }

      // ジャンルフィルター（APIで取得できない場合のクライアント側フィルター）
      let filteredResults = allResults;
      if (selectedGenre) {
        filteredResults = filteredResults.filter((movie) =>
          movie.genres?.some((g) => g.id === selectedGenre)
        );
      }

      // 年代フィルター（APIで取得できない場合のクライアント側フィルター）
      if (selectedYear) {
        filteredResults = filteredResults.filter((movie) => {
          if (!movie.release_date) return false;
          const year = new Date(movie.release_date).getFullYear();
          return year === selectedYear;
        });
      }

      // ソート処理
      let sortedResults = [...filteredResults];
      if (sortBy === "popularity") {
        sortedResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      } else if (sortBy === "rating") {
        sortedResults.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
      } else if (sortBy === "date") {
        sortedResults.sort((a, b) => {
          const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
          const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
          return dateB - dateA;
        });
      }

      if (append) {
        setResults([...results, ...sortedResults]);
      } else {
        setResults(sortedResults);
      }

      // 50件ずつ表示
      const itemsPerPage = 50;
      const newDisplayedCount = append ? displayedResults.length + itemsPerPage : itemsPerPage;
      const newDisplayed = sortedResults.slice(0, newDisplayedCount);
      
      if (append) {
        setDisplayedResults([...displayedResults, ...sortedResults.slice(displayedResults.length, newDisplayedCount)]);
      } else {
        setDisplayedResults(newDisplayed);
      }

      setCurrentPage(append ? currentPage + 1 : 1);
      setTotalPages(totalPagesCount);
      setHasMore(newDisplayedCount < sortedResults.length || (currentPage + 1) * itemsPerPage <= sortedResults.length);

      if (onSearchStateChange) {
        onSearchStateChange(newDisplayed.length > 0);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error searching movies:", error);
      }
      if (!append) {
        setResults([]);
        setDisplayedResults([]);
      }
      if (onSearchStateChange) {
        onSearchStateChange(false);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = async () => {
    if (!query.trim() || isLoadingMore) return;
    await performSearch(query, currentPage + 1, true);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
    <div className="w-full">
      {/* 検索バー */}
      <div className="relative w-full max-w-2xl mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="映画・ドラマを検索..."
            className="w-full h-14 pl-12 pr-12 rounded-full border border-[#1a1a1a] bg-[#0a0a0a] text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* レコメンドドロップダウン */}
        {showHistory && !query.trim() && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] shadow-2xl z-[60] max-h-[600px] overflow-y-auto custom-scrollbar"
          >
            {/* 検索履歴 */}
            {searchHistory.length > 0 && (
              <div className="p-4 border-b border-[#1a1a1a]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#D4AF37]" />
                    <h3 className="text-sm font-semibold text-[#D4AF37]">検索履歴</h3>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAllHistory();
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-red-400 transition-colors"
                    title="すべて削除"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>すべて削除</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {searchHistory.map((historyItem, index) => (
                    <div
                      key={index}
                      className="relative group"
                    >
                      <button
                        onClick={() => {
                          setQuery(historyItem);
                          setShowHistory(false);
                          searchInputRef.current?.blur();
                        }}
                        className="w-full text-left px-4 py-2 pr-10 rounded-lg bg-[#1a1a1a] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 border border-transparent transition-all duration-200 text-white text-sm"
                      >
                        {historyItem}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(historyItem);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-red-500/20 transition-all duration-200 opacity-0 group-hover:opacity-100"
                        title="削除"
                      >
                        <X className="h-4 w-4 text-gray-400 hover:text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* おすすめ映画 */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                <h3 className="text-sm font-semibold text-[#D4AF37]">おすすめ映画</h3>
              </div>
              {isLoadingRecommended ? (
                <div className="flex justify-center items-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {recommendedMovies.map((movie) => {
                    const posterUrl = movie.poster_path
                      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                      : null;
                    return (
                      <button
                        key={movie.id}
                        onClick={(e) => {
                          onMovieSelect(movie, e);
                          setShowHistory(false);
                          searchInputRef.current?.blur();
                        }}
                        className="group flex flex-col overflow-hidden rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#D4AF37]/50 transition-all duration-300 text-left"
                      >
                        <div className="relative w-full aspect-[2/3] overflow-hidden rounded-t-lg">
                          {posterUrl ? (
                            <img
                              src={posterUrl}
                              alt={movie.title}
                              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#2a2a2a] flex flex-col items-center justify-center">
                              <Film className="h-8 w-8 text-gray-600 mb-2" />
                              <p className="text-xs text-gray-500 text-center px-2 line-clamp-2">
                                {movie.title}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h4 className="text-xs font-semibold text-white line-clamp-2 mb-1">
                            {movie.title}
                          </h4>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* フィルター - 高級感のあるデザイン */}
      {query.trim() && (
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="group flex items-center gap-2 px-5 py-3 rounded-full border border-[#1a1a1a] bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a] text-white hover:border-[#D4AF37]/60 hover:bg-gradient-to-r hover:from-[#D4AF37]/10 hover:to-[#D4AF37]/5 transition-all duration-300 shadow-lg hover:shadow-[#D4AF37]/20"
          >
            <Filter className={`h-5 w-5 transition-transform duration-300 ${showFilters ? "rotate-180 text-[#D4AF37]" : "text-gray-400 group-hover:text-[#D4AF37]"}`} />
            <span className="font-medium">フィルター</span>
            {(selectedGenre || selectedYear || selectedMediaType !== "all" || selectedProvider) && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-semibold">
                {[selectedGenre && "ジャンル", selectedYear && "年代", selectedMediaType !== "all" && "媒体", selectedProvider && "配信"].filter(Boolean).length}
              </span>
            )}
          </button>

          {showFilters && (
            <div className="mt-4 p-6 rounded-2xl border border-[#1a1a1a] bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] backdrop-blur-sm shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-300">
              {/* 媒体タイプ */}
              <div>
                <label className="block text-sm font-semibold text-[#D4AF37] mb-3 uppercase tracking-wide">
                  媒体
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedMediaType("all")}
                    className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 font-medium ${
                      selectedMediaType === "all"
                        ? "border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]"
                        : "border-[#1a1a1a] bg-[#0a0a0a]/80 text-gray-400 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
                    }`}
                  >
                    すべて
                  </button>
                  <button
                    onClick={() => setSelectedMediaType("movie")}
                    className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 font-medium flex items-center justify-center gap-2 ${
                      selectedMediaType === "movie"
                        ? "border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]"
                        : "border-[#1a1a1a] bg-[#0a0a0a]/80 text-gray-400 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
                    }`}
                  >
                    <Film className="h-4 w-4" />
                    映画
                  </button>
                  <button
                    onClick={() => setSelectedMediaType("tv")}
                    className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 font-medium flex items-center justify-center gap-2 ${
                      selectedMediaType === "tv"
                        ? "border-[#D4AF37] bg-[#D4AF37]/20 text-[#D4AF37]"
                        : "border-[#1a1a1a] bg-[#0a0a0a]/80 text-gray-400 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
                    }`}
                  >
                    <Tv className="h-4 w-4" />
                    ドラマ
                  </button>
                </div>
              </div>

              {/* 配信プロバイダー */}
              <div>
                <label className="block text-sm font-semibold text-[#D4AF37] mb-3 uppercase tracking-wide">
                  配信サービス
                </label>
                <select
                  value={selectedProvider || ""}
                  onChange={(e) =>
                    setSelectedProvider(e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="w-full rounded-xl border-2 border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-sm px-5 py-3 pr-12 text-white focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 transition-all duration-300 appearance-none cursor-pointer hover:border-[#D4AF37]/50"
                >
                  <option value="">すべての配信サービス</option>
                  {watchProviders.map((provider) => (
                    <option key={provider.provider_id} value={provider.provider_id}>
                      {provider.provider_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ジャンル */}
              <div>
                <label className="block text-sm font-semibold text-[#D4AF37] mb-3 uppercase tracking-wide">
                  ジャンル
                </label>
                <select
                  value={selectedGenre || ""}
                  onChange={(e) =>
                    setSelectedGenre(e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="w-full rounded-xl border-2 border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-sm px-5 py-3 pr-12 text-white focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 transition-all duration-300 appearance-none cursor-pointer hover:border-[#D4AF37]/50"
                >
                  <option value="">すべてのジャンル</option>
                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 年代 */}
              <div>
                <label className="block text-sm font-semibold text-[#D4AF37] mb-3 uppercase tracking-wide">
                  公開年
                </label>
                <select
                  value={selectedYear || ""}
                  onChange={(e) =>
                    setSelectedYear(e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="w-full rounded-xl border-2 border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-sm px-5 py-3 pr-12 text-white focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 transition-all duration-300 appearance-none cursor-pointer hover:border-[#D4AF37]/50"
                >
                  <option value="">すべての年代</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}年
                    </option>
                  ))}
                </select>
              </div>

              {/* フィルターリセットボタン */}
              {(selectedGenre || selectedYear || selectedMediaType !== "all" || selectedProvider) && (
                <button
                  onClick={() => {
                    setSelectedGenre(null);
                    setSelectedYear(null);
                    setSelectedMediaType("all");
                    setSelectedProvider(null);
                  }}
                  className="w-full rounded-xl border-2 border-[#1a1a1a] bg-[#0a0a0a]/50 px-5 py-3 text-gray-400 hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-all duration-300 font-medium"
                >
                  フィルターをリセット
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 検索結果 */}
      {query.trim() && displayedResults.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">
              検索結果 ({displayedResults.length}件{results.length > displayedResults.length ? ` / ${results.length}件` : ""})
            </h3>
            {/* ソート機能 */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "popularity" | "rating" | "date")}
                className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2 pr-8 text-sm text-white focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 transition-all appearance-none cursor-pointer hover:border-[#D4AF37]/50"
              >
                <option value="popularity">人気順</option>
                <option value="rating">評価順</option>
                <option value="date">公開日順</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
            {displayedResults.map((movie) => {
              const posterUrl = movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : null;
              return (
                <button
                  key={movie.id}
                  onClick={(e) => onMovieSelect(movie, e)}
                  className="group flex flex-col h-full overflow-hidden rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#D4AF37]/50 transition-all duration-500 text-left"
                >
                  <div className="relative w-full aspect-[2/3] overflow-hidden rounded-lg transition-transform duration-500 group-hover:scale-105 origin-center">
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={movie.title}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#2a2a2a] flex flex-col items-center justify-center">
                        <Film className="h-12 w-12 text-gray-600 mb-2" />
                        <p className="text-xs text-gray-500 text-center px-2 line-clamp-2">
                          {movie.release_date
                            ? `${movie.title}【${new Date(movie.release_date).getFullYear()}】`
                            : movie.title}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-4 flex flex-col min-h-[80px]">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white line-clamp-2 flex-1 min-h-[2.5rem]">
                        {movie.title}
                      </h3>
                      {movie.media_type && (
                        <span className="text-xs px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 flex-shrink-0 mt-0.5">
                          {movie.media_type === "movie" ? "映画" : "ドラマ"}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 検索結果がない場合の表示 */}
      {query.trim() && !isLoading && !isLoadingMore && displayedResults.length === 0 && (
        <div className="text-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50">
              <Search className="h-10 w-10 text-zinc-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">検索結果が見つかりませんでした</h3>
              <p className="text-gray-400 max-w-md">
                {selectedGenre || selectedYear || selectedMediaType !== "all" || selectedProvider
                  ? "検索条件やフィルターを変更してお試しください"
                  : "別のキーワードで検索してみてください"}
              </p>
            </div>
            {(selectedGenre || selectedYear || selectedMediaType !== "all" || selectedProvider) && (
              <button
                onClick={() => {
                  setSelectedGenre(null);
                  setSelectedYear(null);
                  setSelectedMediaType("all");
                  setSelectedProvider(null);
                }}
                className="mt-4 px-6 py-2 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all duration-300"
              >
                フィルターをリセット
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


