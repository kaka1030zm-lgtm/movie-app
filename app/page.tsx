"use client";

import { useState, useEffect } from "react";
import MovieSearch from "./components/MovieSearch";
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

export default function Home() {
  const [selectedMovie, setSelectedMovie] = useState<MovieSearchResult | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // レビューを読み込む
  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = () => {
    const allReviews = getAllReviews();
    // 作成日時の降順でソート
    setReviews(allReviews.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
  };

  const handleMovieSelect = (movie: MovieSearchResult) => {
    setSelectedMovie(movie);
    // 既存のレビューをチェック
    const existing = getReviewByMovieId(movie.id);
    setEditingReview(existing);
    setIsFormOpen(true);
  };

  const handleSaveReview = (reviewInput: ReviewInput) => {
    if (editingReview) {
      // 更新
      const updated = updateReview(editingReview.id, reviewInput);
      if (updated) {
        loadReviews();
      }
    } else {
      // 新規作成
      saveReview(reviewInput);
      loadReviews();
    }

    // フォームを閉じる
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
    // レビューから映画情報を復元
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

        {/* レビュー一覧セクション */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              マイレビュー ({reviews.length})
            </h2>
          </div>
          <ReviewList reviews={reviews} onEdit={handleEdit} onDelete={handleDelete} />
        </div>
      </main>

      {/* 評価フォームモーダル */}
      {isFormOpen && selectedMovie && (
        <RatingForm
          movie={selectedMovie}
          existingReview={editingReview ? {
            ratings: editingReview.ratings,
            comment: editingReview.comment,
          } : null}
          onSave={handleSaveReview}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
