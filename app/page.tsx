"use client";

import { useState, useEffect } from "react";
import MovieSearch from "./components/MovieSearch";
import PopularMoviesCarousel from "./components/PopularMoviesCarousel";
import RatingForm from "./components/RatingForm";
import ReviewList from "./components/ReviewList";
import WatchlistList from "./components/WatchlistList";
import ConfirmModal from "./components/ConfirmModal";
import { MovieSearchResult, Review, ReviewInput } from "@/types/movie";
import {
  getAllReviews,
  saveReview,
  updateReview,
  deleteReview,
  getReviewByMovieId,
} from "@/lib/reviews";
import { getPopularMovies } from "@/lib/tmdb";
import { getWatchlist, removeFromWatchlist, WatchlistItem } from "@/lib/watchlist";
import { getRecommendedMovies } from "@/lib/recommendations";

type TabType = "popular" | "reviews" | "watchlist";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("popular");
  const [selectedMovie, setSelectedMovie] = useState<MovieSearchResult | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [popularMovies, setPopularMovies] = useState<MovieSearchResult[]>([]);
  const [regionalMovies, setRegionalMovies] = useState<MovieSearchResult[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<MovieSearchResult[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);
  const [isLoadingRegional, setIsLoadingRegional] = useState(false);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
  const [userCountry, setUserCountry] = useState<string>("JP");
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; reviewId: string | null }>({
    isOpen: false,
    reviewId: null,
  });
  const [watchlistDeleteConfirm, setWatchlistDeleteConfirm] = useState<{ isOpen: boolean; movieId: number | null }>({
    isOpen: false,
    movieId: null,
  });
  const [hasSearchResults, setHasSearchResults] = useState(false);

  // レビューを読み込む
  useEffect(() => {
    loadReviews();
  }, []);

  // ユーザーの国を取得（簡易版：デフォルトJP）
  useEffect(() => {
    // 実際の実装では、IPから国を取得するか、ユーザー設定から取得
    // ここではデフォルトでJPを使用
    setUserCountry("JP");
  }, []);

  // 人気映画を読み込む
  useEffect(() => {
    loadPopularMovies();
  }, []);

  // 国内人気映画を読み込む
  useEffect(() => {
    if (userCountry && popularMovies.length > 0) {
      loadRegionalMovies();
    }
  }, [userCountry, popularMovies]);

  // 見たいリストを読み込む
  useEffect(() => {
    loadWatchlist();
  }, []);

  // おすすめ映画を読み込む
  useEffect(() => {
    loadRecommendedMovies();
  }, [watchlist, popularMovies]);

  const loadReviews = () => {
    const allReviews = getAllReviews();
    setReviews(
      allReviews.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    );
  };

  const loadPopularMovies = async () => {
    setIsLoadingPopular(true);
    try {
      const movies = await getPopularMovies();
      setPopularMovies(
        movies.map((movie) => ({
          id: movie.id,
          title: movie.title || movie.name || "",
          poster_path: movie.poster_path,
          release_date: movie.release_date || movie.first_air_date || null,
          overview: movie.overview,
          vote_average: movie.vote_average,
          popularity: movie.popularity,
          genres: movie.genres,
          media_type: movie.media_type as "movie" | "tv",
        }))
      );
    } catch (error) {
      console.error("Error loading popular movies:", error);
    } finally {
      setIsLoadingPopular(false);
    }
  };

  const loadWatchlist = () => {
    const items = getWatchlist();
    setWatchlist(items.sort((a, b) => 
      new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
    ));
  };

  const loadRegionalMovies = async () => {
    setIsLoadingRegional(true);
    try {
      const movies = await getPopularMovies(userCountry); // 国内人気映画
      const popularMovieIds = popularMovies.map((m) => m.id);
      // 世界の人気映画と重複しないようにフィルター
      const filtered = movies
        .filter((movie) => !popularMovieIds.includes(movie.id))
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
      setRegionalMovies(filtered.slice(0, 30));
    } catch (error) {
      console.error("Error loading regional movies:", error);
    } finally {
      setIsLoadingRegional(false);
    }
  };

  const loadRecommendedMovies = async () => {
    if (watchlist.length === 0) {
      setRecommendedMovies([]);
      return;
    }

    setIsLoadingRecommended(true);
    try {
      // 人気映画と国内映画のIDを収集
      const popularMovieIds = popularMovies.map((m) => m.id);
      const regionalMovieIds = regionalMovies.map((m) => m.id);
      const excludeIds = [...popularMovieIds, ...regionalMovieIds];

      const movies = await getRecommendedMovies(excludeIds);
      setRecommendedMovies(movies);
    } catch (error) {
      console.error("Error loading recommended movies:", error);
    } finally {
      setIsLoadingRecommended(false);
    }
  };

  const handleMovieSelect = (movie: MovieSearchResult) => {
    setSelectedMovie(movie);
    const existing = getReviewByMovieId(movie.id);
    setEditingReview(existing);
    setIsFormOpen(true);
  };

  const handleSaveReview = (reviewInput: ReviewInput) => {
    if (editingReview) {
      const updated = updateReview(editingReview.id, reviewInput);
      if (updated) {
        loadReviews();
      }
    } else {
      saveReview(reviewInput);
      loadReviews();
    }

    setIsFormOpen(false);
    setSelectedMovie(null);
    setEditingReview(null);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setSelectedMovie(null);
    setEditingReview(null);
  };

  const handleEdit = (review: Review) => {
    const movie: MovieSearchResult = {
      id: review.movie_id,
      title: review.movie_title,
      poster_path: review.movie_poster_path,
      release_date: review.movie_release_date,
      overview: null,
    };
    setSelectedMovie(movie);
    setEditingReview(review);
    setIsFormOpen(true);
  };

  const handleDelete = (reviewId: string) => {
    setDeleteConfirm({ isOpen: true, reviewId });
  };

  const confirmDelete = () => {
    if (deleteConfirm.reviewId && deleteReview(deleteConfirm.reviewId)) {
      loadReviews();
    }
    setDeleteConfirm({ isOpen: false, reviewId: null });
  };

  const handleWatchlistMovieSelect = (item: WatchlistItem) => {
    const movie: MovieSearchResult = {
      id: item.id,
      title: item.title,
      poster_path: item.poster_path,
      release_date: item.release_date,
      overview: item.overview,
      media_type: item.media_type,
    };
    handleMovieSelect(movie);
  };

  const handleWatchlistRemove = (movieId: number) => {
    setWatchlistDeleteConfirm({ isOpen: true, movieId });
  };

  const confirmWatchlistDelete = () => {
    if (watchlistDeleteConfirm.movieId && removeFromWatchlist(watchlistDeleteConfirm.movieId)) {
      loadWatchlist();
    }
    setWatchlistDeleteConfirm({ isOpen: false, movieId: null });
  };

  const handleReviewMovieClick = (review: Review) => {
    const movie: MovieSearchResult = {
      id: review.movie_id,
      title: review.movie_title,
      poster_path: review.movie_poster_path,
      release_date: review.movie_release_date,
      overview: null,
    };
    handleMovieSelect(movie);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ヘッダー */}
      <header className="border-b border-[#1a1a1a] bg-black/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-[#D4AF37]">MovieRating</h1>
          <p className="text-sm text-gray-400 mt-1">映画評価システム</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 検索セクション */}
        <div className="mb-12">
          <MovieSearch 
            onMovieSelect={handleMovieSelect} 
            onSearchStateChange={setHasSearchResults}
          />
        </div>

        {/* Tabs - hidden when search results are displayed */}
        {!hasSearchResults && (
          <div className="mb-8 border-b border-[#1a1a1a]">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("popular")}
                className={`px-6 py-3 font-medium transition-all duration-300 relative ${
                  activeTab === "popular"
                    ? "text-[#D4AF37]"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                人気の映画
                {activeTab === "popular" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] animate-in slide-in-from-left duration-300" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`px-6 py-3 font-medium transition-all duration-300 relative ${
                  activeTab === "reviews"
                    ? "text-[#D4AF37]"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                マイレビュー ({reviews.length})
                {activeTab === "reviews" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] animate-in slide-in-from-left duration-300" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("watchlist")}
                className={`px-6 py-3 font-medium transition-all duration-300 relative ${
                  activeTab === "watchlist"
                    ? "text-[#D4AF37]"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                見たいリスト ({watchlist.length})
                {activeTab === "watchlist" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] animate-in slide-in-from-left duration-300" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab content - hidden when search results are displayed */}
        {!hasSearchResults && (
          <div className="relative">
          <div
            className={`transition-all duration-500 ease-in-out ${
              activeTab === "popular"
                ? "opacity-100 translate-x-0 relative"
                : "opacity-0 translate-x-8 absolute inset-0 pointer-events-none"
            }`}
          >
            {isLoadingPopular ? (
              <div className="flex justify-center items-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
              </div>
            ) : (
              <>
                <PopularMoviesCarousel
                  movies={popularMovies}
                  onMovieSelect={handleMovieSelect}
                  title="世界の人気映画 TOP 30"
                />
                
                {/* 国内人気映画 */}
                {!isLoadingRegional && regionalMovies.length > 0 && (
                  <PopularMoviesCarousel
                    movies={regionalMovies}
                    onMovieSelect={handleMovieSelect}
                    title="🇯🇵 国内の人気映画"
                  />
                )}

                {/* おすすめ映画 */}
                {!isLoadingRecommended && recommendedMovies.length > 0 && (
                  <PopularMoviesCarousel
                    movies={recommendedMovies}
                    onMovieSelect={handleMovieSelect}
                    title="⭐ あなたへのおすすめ"
                  />
                )}
              </>
            )}
          </div>

          <div
            className={`transition-all duration-500 ease-in-out ${
              activeTab === "reviews"
                ? "opacity-100 translate-x-0 relative"
                : "opacity-0 -translate-x-8 absolute inset-0 pointer-events-none"
            }`}
          >
            <ReviewList
              reviews={reviews}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMovieClick={handleReviewMovieClick}
            />
          </div>

          <div
            className={`transition-all duration-500 ease-in-out ${
              activeTab === "watchlist"
                ? "opacity-100 translate-x-0 relative"
                : "opacity-0 translate-x-8 absolute inset-0 pointer-events-none"
            }`}
          >
            <WatchlistList
              watchlist={watchlist}
              onMovieSelect={handleWatchlistMovieSelect}
              onRemove={handleWatchlistRemove}
            />
          </div>
        </div>
        )}
      </main>

      {/* 評価フォームモーダル */}
      {isFormOpen && selectedMovie && (
        <RatingForm
          movie={selectedMovie}
          existingReview={
            editingReview
              ? {
                  ratings: editingReview.ratings,
                  comment: editingReview.comment,
                }
              : null
          }
          onSave={handleSaveReview}
          onCancel={handleCancel}
          onWatchlistChange={loadWatchlist}
        />
      )}

      {/* レビュー削除確認モーダル */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="レビューを削除"
        message="このレビューを削除しますか？この操作は取り消せません。"
        confirmText="削除"
        cancelText="キャンセル"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, reviewId: null })}
      />

      {/* 見たいリスト削除確認モーダル */}
      <ConfirmModal
        isOpen={watchlistDeleteConfirm.isOpen}
        title="見たいリストから削除"
        message="この映画を見たいリストから削除しますか？"
        confirmText="削除"
        cancelText="キャンセル"
        onConfirm={confirmWatchlistDelete}
        onCancel={() => setWatchlistDeleteConfirm({ isOpen: false, movieId: null })}
      />
    </div>
  );
}
