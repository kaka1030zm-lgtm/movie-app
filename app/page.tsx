"use client";

import { useState, useEffect } from "react";
import Header from "./components/Header";
import MovieSearch from "./components/MovieSearch";
import ReviewForm from "./components/ReviewForm";
import MovieList from "./components/MovieList";
import { MovieSearchResult } from "./components/types";
import { Review, ReviewInsert } from "../types/database";

const STORAGE_KEY = "cinelog_reviews";

export default function Home() {
  const [selectedMovie, setSelectedMovie] = useState<MovieSearchResult | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  // ローカルストレージからレビューを読み込む
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setReviews(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Error loading reviews:", error);
      }
    }
  }, []);

  // レビューを保存
  const handleSaveReview = (reviewData: ReviewInsert) => {
    const newReview: Review = {
      id: editingReview?.id || crypto.randomUUID(),
      ...reviewData,
      created_at: editingReview?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let updatedReviews: Review[];
    if (editingReview) {
      updatedReviews = reviews.map((r) => (r.id === editingReview.id ? newReview : r));
    } else {
      updatedReviews = [...reviews, newReview];
    }

    setReviews(updatedReviews);
    
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReviews));
    }

    setSelectedMovie(null);
    setEditingReview(null);
  };

  const handleEditReview = (review: Review) => {
    const movie: MovieSearchResult = {
      id: review.movie_id,
      title: review.title,
      poster_path: review.poster_path,
      release_date: null,
      overview: null,
    };
    setSelectedMovie(movie);
    setEditingReview(review);
  };

  const handleDeleteReview = (reviewId: string) => {
    if (confirm("このレビューを削除しますか？")) {
      const updatedReviews = reviews.filter((r) => r.id !== reviewId);
      setReviews(updatedReviews);
      
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReviews));
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">映画レビュー</h2>
          <p className="text-gray-400">あなたの映画体験を記録しましょう</p>
        </div>

        {/* 検索とフォーム */}
        <div className="mb-12">
          <div className="mb-6">
            <MovieSearch onMovieSelect={setSelectedMovie} />
          </div>

          {selectedMovie && (
            <ReviewForm
              movie={selectedMovie}
              existingReview={editingReview}
              onSave={handleSaveReview}
              onCancel={() => {
                setSelectedMovie(null);
                setEditingReview(null);
              }}
            />
          )}
        </div>

        {/* レビュー一覧 */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-6">
            レビュー一覧 ({reviews.length})
          </h3>
          <MovieList
            reviews={reviews}
            onEdit={handleEditReview}
            onDelete={handleDeleteReview}
          />
        </div>
      </main>
    </div>
  );
}
