"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "./components/Header";
import MovieSearch from "./components/MovieSearch";
import ReviewForm from "./components/ReviewForm";
import MovieList from "./components/MovieList";
import MovieDetailModal from "./components/MovieDetailModal";
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
  const [recommendedMovies, setRecommendedMovies] = useState<MovieSearchResult[]>([]);
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

  // 人気の映画を取得
  useEffect(() => {
    const fetchPopularMovies = async () => {
      if (!TMDB_API_KEY) {
        setError("TMDB APIキーが設定されていません。.env.localファイルにNEXT_PUBLIC_TMDB_API_KEYを設定してください。");
        setPopularMovies([]);
        return;
      }

      setIsLoading(true);
      setError(null);
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
          setError("人気の映画が見つかりませんでした。");
        }
      } catch (error) {
        console.error("Error fetching popular movies:", error);
        setError(error instanceof Error ? error.message : "映画データの取得に失敗しました。");
        setPopularMovies([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === "popular") {
      fetchPopularMovies();
    }
  }, [activeTab, TMDB_API_KEY, apiLang]);

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
    if (activeTab === "popular") return popularMovies;
    if (activeTab === "recommended") return recommendedMovies;
    return [];
  }, [activeTab, popularMovies, recommendedMovies]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
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
            {activeTab === "recommended" && (
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white">{t.recommended}</h2>
                <p className="text-sm text-zinc-400">{t.recommendationSub}</p>
              </div>
            )}

            {/* 検索 */}
            <MovieSearch onSelectMovie={handleSelectMovie} />

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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-amber-400"></div>
                  <p className="text-zinc-400">{t.processing}</p>
                </div>
              </div>
            ) : displayMovies.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {displayMovies.map((movie) => (
                  <button
                    key={movie.id}
                    onClick={() => setSelectedMovieForDetail(movie)}
                    className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 transition-all hover:border-amber-400/50 hover:bg-zinc-800/50"
                  >
                    {movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                        alt={movie.title || movie.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-64 w-full items-center justify-center bg-zinc-800">
                        <span className="text-4xl">🎬</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-sm font-semibold text-white">
                          {movie.title || movie.name}
                        </h3>
                        {movie.vote_average > 0 && (
                          <p className="mt-1 text-xs text-zinc-300">
                            ⭐ {movie.vote_average.toFixed(1)}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : !isLoading && !error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="mb-4 text-6xl">🎬</span>
                <p className="text-zinc-400">映画が見つかりませんでした</p>
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
    </div>
  );
}
