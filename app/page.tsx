"use client";

import { useState, useEffect } from "react";
import MovieSearch from "./components/MovieSearch";
import PopularMoviesCarousel from "./components/PopularMoviesCarousel";
import RatingForm from "./components/RatingForm";
import ReviewList from "./components/ReviewList";
import { MovieSearchResult, Review, ReviewInput } from "@/types/movie";
import {
  getAllReviews,
  saveReview,
  updateReview,
  deleteReview,
  getReviewByMovieId,
} from "@/lib/reviews";
import { getPopularMovies } from "@/lib/tmdb";

type TabType = "popular" | "reviews";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("popular");
  const [selectedMovie, setSelectedMovie] = useState<MovieSearchResult | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [popularMovies, setPopularMovies] = useState<MovieSearchResult[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // レビューを読み込む
  useEffect(() => {
    loadReviews();
  }, []);

  // 人気映画を読み込む
  useEffect(() => {
    loadPopularMovies();
  }, []);

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
    if (deleteReview(reviewId)) {
      loadReviews();
    }
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
          <MovieSearch onMovieSelect={handleMovieSelect} />
        </div>

        {/* タブ */}
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
          </div>
        </div>

        {/* タブコンテンツ */}
        <div className="relative">
          <div
            className={`transition-all duration-500 ease-in-out ${
              activeTab === "popular"
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-8 absolute inset-0 pointer-events-none"
            }`}
          >
            {isLoadingPopular ? (
              <div className="flex justify-center items-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
              </div>
            ) : (
              <PopularMoviesCarousel
                movies={popularMovies}
                onMovieSelect={handleMovieSelect}
              />
            )}
          </div>

          <div
            className={`transition-all duration-500 ease-in-out ${
              activeTab === "reviews"
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8 absolute inset-0 pointer-events-none"
            }`}
          >
            <ReviewList
              reviews={reviews}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>
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
        />
      )}
    </div>
  );
}
