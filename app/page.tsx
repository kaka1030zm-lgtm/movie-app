"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "./components/Header";
import MovieSearch from "./components/MovieSearch";
import MovieCard from "./components/MovieCard";
import MovieCarousel from "./components/MovieCarousel";
import ReviewForm from "./components/ReviewForm";
import MovieList from "./components/MovieList";
import MovieDetailModal from "./components/MovieDetailModal";
import UpdateChecker from "./components/UpdateChecker";
import { useTranslation } from "./hooks/useTranslation";
import { MovieSearchResult, ReviewRecord, WatchlistItem } from "./components/types";

const STORAGE_KEY_REVIEWS = "cinelog_reviews";
const STORAGE_KEY_WATCHLIST = "cinelog_watchlist";

export default function Home() {
  const { t, apiLang } = useTranslation();
  const [activeTab, setActiveTab] = useState<"popular" | "recommended" | "reviews" | "watchlist">("popular");
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieSearchResult | null>(null);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewRecord | null>(null);
  const [selectedMovieForDetail, setSelectedMovieForDetail] = useState<MovieSearchResult | null>(null);
  const [popularMovies, setPopularMovies] = useState<MovieSearchResult[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<MovieSearchResult[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<MovieSearchResult[]>([]);
  const [searchResults, setSearchResults] = useState<MovieSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  // ローカルストレージからデータを読み込む
  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window === "undefined") {
      return;
    }

    try {
      const savedReviews = localStorage.getItem(STORAGE_KEY_REVIEWS);
      const savedWatchlist = localStorage.getItem(STORAGE_KEY_WATCHLIST);

      if (savedReviews) {
        try {
          setReviews(JSON.parse(savedReviews));
        } catch (e) {
          console.error("Error loading reviews:", e);
        }
      }

      if (savedWatchlist) {
        try {
          setWatchlist(JSON.parse(savedWatchlist));
        } catch (e) {
          console.error("Error loading watchlist:", e);
        }
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  }, []);

  // レビューを保存
  useEffect(() => {
    if (reviews.length > 0) {
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviews));
    }
  }, [reviews]);

  // 見たいリストを保存
  useEffect(() => {
    if (watchlist.length > 0) {
      localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(watchlist));
    }
  }, [watchlist]);

  // 人気の映画を取得（カルーセル用）
  useEffect(() => {
    const fetchPopularMovies = async () => {
      if (!TMDB_API_KEY) {
        return;
      }

      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=${apiLang}&region=JP`
        );

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          setPopularMovies(data.results.slice(0, 20));
        } else {
          setPopularMovies([]);
        }
      } catch (error) {
        console.error("Error fetching popular movies:", error);
        setPopularMovies([]);
      }
    };

    fetchPopularMovies();
  }, [TMDB_API_KEY, apiLang]);

  // 高評価映画を取得（カルーセル用）
  useEffect(() => {
    const fetchTopRatedMovies = async () => {
      if (!TMDB_API_KEY) {
        return;
      }

      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&language=${apiLang}&region=JP`
        );

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          setTopRatedMovies(data.results.slice(0, 20));
        } else {
          setTopRatedMovies([]);
        }
      } catch (error) {
        console.error("Error fetching top rated movies:", error);
        setTopRatedMovies([]);
      }
    };

    fetchTopRatedMovies();
  }, [TMDB_API_KEY, apiLang]);

  // おすすめ映画を取得（見たいリストに基づく）
  useEffect(() => {
    const fetchRecommendedMovies = async () => {
      if (watchlist.length === 0 || !TMDB_API_KEY) {
        setRecommendedMovies([]);
        return;
      }

      setIsLoading(true);
      try {
        // 見たいリストの最初の作品のジャンルに基づいておすすめを取得
        const firstItem = watchlist[0];
        const response = await fetch(
          `https://api.themoviedb.org/3/${firstItem.mediaType}/${firstItem.id}?api_key=${TMDB_API_KEY}&language=${apiLang}`
        );
        const details = await response.json();

        if (details.genres && details.genres.length > 0) {
          const genreId = details.genres[0].id;
          const recResponse = await fetch(
            `https://api.themoviedb.org/3/discover/${firstItem.mediaType}?api_key=${TMDB_API_KEY}&language=${apiLang}&with_genres=${genreId}&sort_by=popularity.desc`
          );
          const recData = await recResponse.json();
          setRecommendedMovies(recData.results?.slice(0, 20) || []);
        }
      } catch (error) {
        console.error("Error fetching recommended movies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === "recommended") {
      fetchRecommendedMovies();
    }
  }, [activeTab, watchlist, TMDB_API_KEY, apiLang]);

  const handleSelectMovie = (movie: MovieSearchResult) => {
    setSelectedMovie(movie);
    setIsReviewFormOpen(true);
    setEditingReview(null);
  };

  const handleSaveReview = (reviewData: Omit<ReviewRecord, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    if (editingReview) {
      // 既存のレビューを更新
      setReviews((prev) =>
        prev.map((r) =>
          r.id === editingReview.id
            ? { ...r, ...reviewData, updatedAt: now }
            : r
        )
      );
    } else {
      // 新しいレビューを追加
      const newReview: ReviewRecord = {
        ...reviewData,
        id: `review_${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      setReviews((prev) => [...prev, newReview]);
    }
    setIsReviewFormOpen(false);
    setSelectedMovie(null);
    setEditingReview(null);
  };

  const handleEditReview = (review: ReviewRecord) => {
    // レビューから映画情報を復元
    const movie: MovieSearchResult = {
      id: review.movieId,
      title: review.title,
      original_title: review.originalTitle,
      overview: "",
      poster_path: review.posterPath,
      backdrop_path: review.backdropPath,
      release_date: review.releaseDate,
      media_type: review.mediaType,
      vote_average: 0,
    };
    setSelectedMovie(movie);
    setEditingReview(review);
    setIsReviewFormOpen(true);
  };

  const handleDeleteReview = (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddToWatchlist = (movie: MovieSearchResult) => {
    const watchlistItem: WatchlistItem = {
      id: movie.id,
      title: movie.title || movie.name || "",
      originalTitle: movie.original_title || movie.original_name,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      releaseDate: movie.release_date || movie.first_air_date,
      mediaType: movie.media_type || (movie.name ? "tv" : "movie"),
      addedAt: new Date().toISOString(),
    };

    // 既に存在するかチェック
    if (!watchlist.some((item) => item.id === movie.id)) {
      setWatchlist((prev) => [...prev, watchlistItem]);
    }
  };

  const handleRemoveFromWatchlist = (id: number) => {
    setWatchlist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddReviewFromWatchlist = (item: WatchlistItem) => {
    const movie: MovieSearchResult = {
      id: item.id,
      title: item.title,
      original_title: item.originalTitle,
      overview: "",
      poster_path: item.posterPath,
      backdrop_path: item.backdropPath,
      release_date: item.releaseDate,
      media_type: item.mediaType,
      vote_average: 0,
    };
    handleSelectMovie(movie);
  };

  const isMovieInWatchlist = (movieId: number) => {
    return watchlist.some((item) => item.id === movieId);
  };

  const displayMovies = useMemo(() => {
    // 検索クエリがある場合は検索結果を表示
    if (searchQuery.trim()) {
      return searchResults;
    }
    // 空欄の場合はタブに応じたリストを表示
    // カルーセルで表示するため、グリッドには表示しない
    if (activeTab === "popular") return []; // カルーセルで表示するため空配列
    if (activeTab === "recommended") return recommendedMovies;
    return [];
  }, [activeTab, recommendedMovies, searchQuery, searchResults]);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#121212] text-white">
      <Header
        onSearchResults={setSearchResults}
        onQueryChange={setSearchQuery}
        isLoading={isLoading}
      />
      <main className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* 人気/おすすめ映画カルーセル（検索結果がない場合のみ表示、検索バー直下） */}
        {!searchQuery.trim() && activeTab === "popular" && (
          <div className="mb-8">
            {popularMovies.length > 0 && (
              <MovieCarousel
                title="🔥 人気映画"
                movies={popularMovies}
                onMovieClick={setSelectedMovieForDetail}
              />
            )}
            {topRatedMovies.length > 0 && (
              <MovieCarousel
                title="⭐ 高評価映画"
                movies={topRatedMovies}
                onMovieClick={setSelectedMovieForDetail}
              />
            )}
          </div>
        )}

        {/* タブ */}
        <div className="mb-8 flex flex-wrap gap-2 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab("popular")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "popular"
                ? "border-b-2 border-amber-400 text-amber-400"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {t.popular}
          </button>
          <button
            onClick={() => setActiveTab("recommended")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "recommended"
                ? "border-b-2 border-amber-400 text-amber-400"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {t.recommended}
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "reviews"
                ? "border-b-2 border-amber-400 text-amber-400"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {t.myReviews}
          </button>
          <button
            onClick={() => setActiveTab("watchlist")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "watchlist"
                ? "border-b-2 border-amber-400 text-amber-400"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {t.watchlist}
          </button>
        </div>

        {/* コンテンツ */}
        {activeTab === "reviews" || activeTab === "watchlist" ? (
          <MovieList
            reviews={reviews}
            watchlist={watchlist}
            activeTab={activeTab}
            onEditReview={handleEditReview}
            onDeleteReview={handleDeleteReview}
            onRemoveFromWatchlist={handleRemoveFromWatchlist}
            onAddReview={handleAddReviewFromWatchlist}
          />
        ) : (
          <div className="space-y-6">
            {activeTab === "recommended" && !searchQuery.trim() && (
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white">{t.recommended}</h2>
                <p className="text-sm text-zinc-400">{t.recommendationSub}</p>
              </div>
            )}

            {/* 検索結果タイトル */}
            {searchQuery.trim() && (
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white">
                  {t.searchResults} {searchResults.length > 0 && `(${searchResults.length})`}
                </h2>
              </div>
            )}

            {/* エラーメッセージ */}
            {error && (
              <div className="rounded-lg border border-amber-400/50 bg-amber-400/10 p-4 text-amber-400">
                <p className="font-medium">⚠️ {error}</p>
                {!TMDB_API_KEY && (
                  <p className="mt-2 text-sm">
                    TMDB APIキーを取得するには、<a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" className="underline">TMDBの設定ページ</a>からAPIキーを取得し、.env.localファイルに追加してください。
                  </p>
                )}
              </div>
            )}

            {/* 映画リスト */}
            {isLoading && !searchQuery.trim() ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-lg bg-zinc-900/50 animate-pulse">
                    <div className="aspect-[2/3] w-full bg-zinc-800"></div>
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                      <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : displayMovies.length > 0 ? (
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
                {displayMovies.map((movie, index) => (
                  <div
                    key={movie.id}
                    className="animate-in fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <MovieCard
                      movie={movie}
                      onClick={() => setSelectedMovieForDetail(movie)}
                      isLoading={false}
                    />
                  </div>
                ))}
              </div>
            ) : !isLoading && !error && searchQuery.trim() ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="mb-4 text-6xl">🎬</span>
                <p className="text-zinc-400">検索結果が見つかりませんでした</p>
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* レビューフォーム */}
      {isReviewFormOpen && (
        <ReviewForm
          movie={selectedMovie}
          existingReview={editingReview}
          onSave={handleSaveReview}
          onClose={() => {
            setIsReviewFormOpen(false);
            setSelectedMovie(null);
            setEditingReview(null);
          }}
        />
      )}

      {/* 映画詳細モーダル */}
      {selectedMovieForDetail && (
        <MovieDetailModal
          movie={selectedMovieForDetail}
          isInWatchlist={isMovieInWatchlist(selectedMovieForDetail.id)}
          onClose={() => setSelectedMovieForDetail(null)}
          onAddToWatchlist={handleAddToWatchlist}
          onRemoveFromWatchlist={handleRemoveFromWatchlist}
          onWriteReview={(movie) => {
            setSelectedMovieForDetail(null);
            handleSelectMovie(movie);
          }}
        />
      )}

      {/* 更新チェッカー */}
      <UpdateChecker />
    </div>
  );
}
