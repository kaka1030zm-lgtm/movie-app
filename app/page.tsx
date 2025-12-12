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
import Toast from "./components/Toast";
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
  const [regionalPopularMovies, setRegionalPopularMovies] = useState<MovieSearchResult[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<MovieSearchResult[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<MovieSearchResult[]>([]);
  const [searchResults, setSearchResults] = useState<MovieSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [watchlistLoading, setWatchlistLoading] = useState<{ [movieId: number]: boolean }>({});
  const [countryCode, setCountryCode] = useState<string>("JP");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  // 簡易的なユーザーID取得（認証チェック）
  const getUserId = (): string => {
    if (typeof window === "undefined") return "";
    let userId = localStorage.getItem("cinelog_userId");
    if (!userId) {
      userId = `user_${Date.now()}`;
      localStorage.setItem("cinelog_userId", userId);
    }
    return userId;
  };

  // 既存レビューのチェック
  const getExistingReview = (movieId: number): ReviewRecord | null => {
    const userId = getUserId();
    return reviews.find((r) => r.movieId === movieId && r.userId === userId) || null;
  };

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

  // 地域情報を取得
  useEffect(() => {
    const fetchRegion = async () => {
      try {
        const response = await fetch("/api/region");
        const data = await response.json();
        setCountryCode(data.countryCode || "JP");
      } catch (error) {
        console.error("Error fetching region:", error);
        setCountryCode("JP");
      }
    };

    fetchRegion();
  }, []);

  // ログイン状態をチェック
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userId = localStorage.getItem("cinelog_userId");
      setIsLoggedIn(!!userId);
    }
  }, []);

  // 世界の人気映画を取得（カルーセル用）
  useEffect(() => {
    const fetchPopularMovies = async () => {
      if (!TMDB_API_KEY) {
        return;
      }

      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=${apiLang}&page=1`
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

  // 国内人気映画を取得（動的）
  useEffect(() => {
    const fetchRegionalPopularMovies = async () => {
      if (!TMDB_API_KEY || !countryCode) {
        return;
      }

      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=${apiLang}&region=${countryCode}`
        );

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          // 重複排除: 世界の人気映画のIDを除外
          const worldMovieIds = new Set(popularMovies.map(m => m.id));
          const filtered = data.results.filter((m: MovieSearchResult) => !worldMovieIds.has(m.id));
          setRegionalPopularMovies(filtered.slice(0, 20));
        } else {
          setRegionalPopularMovies([]);
        }
      } catch (error) {
        console.error("Error fetching regional popular movies:", error);
        setRegionalPopularMovies([]);
      }
    };

    if (popularMovies.length > 0) {
      fetchRegionalPopularMovies();
    }
  }, [TMDB_API_KEY, apiLang, countryCode, popularMovies]);

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
      if (!TMDB_API_KEY) {
        return;
      }

      setIsLoading(true);
      try {
        // 未ログインの場合
        if (!isLoggedIn) {
          setRecommendedMovies([]);
          setIsLoading(false);
          return;
        }

        // 見たいリストが空の場合: 世界の人気映画のPage 2を取得
        if (watchlist.length === 0) {
          const response = await fetch(
            `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=${apiLang}&page=2`
          );
          const data = await response.json();
          
          // 重複排除: 世界+国内の人気映画のIDを除外
          const worldMovieIds = new Set(popularMovies.map(m => m.id));
          const regionalMovieIds = new Set(regionalPopularMovies.map(m => m.id));
          const allExcludedIds = new Set([...worldMovieIds, ...regionalMovieIds]);
          
          const filtered = (data.results || []).filter((m: MovieSearchResult) => !allExcludedIds.has(m.id));
          setRecommendedMovies(filtered.slice(0, 20));
          setIsLoading(false);
          return;
        }

        // 見たいリストがある場合: パーソナライズロジック
        // 見たいリストの全映画のジャンルと公開日を分析
        const genreIds = new Set<number>();
        const mediaTypes = new Set<string>();
        
        // 見たいリストの各映画の詳細を取得してジャンルを収集
        const detailsPromises = watchlist.slice(0, 5).map(async (item) => {
          try {
            const response = await fetch(
              `https://api.themoviedb.org/3/${item.mediaType}/${item.id}?api_key=${TMDB_API_KEY}&language=${apiLang}`
            );
            const details = await response.json();
            if (details.genres) {
              details.genres.forEach((g: { id: number }) => genreIds.add(g.id));
            }
            mediaTypes.add(item.mediaType);
            return details;
          } catch (error) {
            console.error(`Error fetching details for ${item.id}:`, error);
            return null;
          }
        });

        await Promise.all(detailsPromises);

        // ジャンルIDを配列に変換
        const genreIdsArray = Array.from(genreIds);
        const mediaType = mediaTypes.has("tv") ? "tv" : "movie";

        if (genreIdsArray.length > 0) {
          // /discoverエンドポイントで類似映画を検索
          const recResponse = await fetch(
            `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${TMDB_API_KEY}&language=${apiLang}&with_genres=${genreIdsArray.join(",")}&sort_by=popularity.desc&page=1`
          );
          const recData = await recResponse.json();
          
          // 重複排除: 世界+国内の人気映画のIDを除外
          const worldMovieIds = new Set(popularMovies.map(m => m.id));
          const regionalMovieIds = new Set(regionalPopularMovies.map(m => m.id));
          const allExcludedIds = new Set([...worldMovieIds, ...regionalMovieIds]);
          
          const filtered = (recData.results || []).filter((m: MovieSearchResult) => !allExcludedIds.has(m.id));
          setRecommendedMovies(filtered.slice(0, 20));
        } else {
          setRecommendedMovies([]);
        }
      } catch (error) {
        console.error("Error fetching recommended movies:", error);
        setRecommendedMovies([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === "recommended") {
      fetchRecommendedMovies();
    }
  }, [activeTab, watchlist, TMDB_API_KEY, apiLang, isLoggedIn, popularMovies, regionalPopularMovies]);

  const handleSelectMovie = (movie: MovieSearchResult) => {
    setSelectedMovie(movie);
    setIsReviewFormOpen(true);
    setEditingReview(null);
  };

  const handleSaveReview = async (reviewData: Omit<ReviewRecord, "id" | "createdAt" | "updatedAt">) => {
    try {
      const now = new Date().toISOString();
      const userId = getUserId();

      // サーバー側バリデーション（簡易版）
      if (!reviewData.reviewTitle?.trim()) {
        setToast({ message: "レビューのタイトルを入力してください", type: "error" });
        return;
      }
      if (!reviewData.reviewBody?.trim()) {
        setToast({ message: "レビュー本文を入力してください", type: "error" });
        return;
      }

      // 既存レビューのチェック（新規投稿時）
      if (!editingReview) {
        const existing = getExistingReview(reviewData.movieId);
        if (existing) {
          setToast({ message: "この映画には既にレビューを投稿しています。編集してください。", type: "error" });
          return;
        }
      }

      // データ所有権チェック（編集時）
      if (editingReview && editingReview.userId !== userId) {
        setToast({ message: "このレビューを編集する権限がありません", type: "error" });
        return;
      }

      if (editingReview) {
        // 既存のレビューを更新
        setReviews((prev) =>
          prev.map((r) =>
            r.id === editingReview.id
              ? { ...r, ...reviewData, userId, updatedAt: now }
              : r
          )
        );
        setToast({ message: "レビューを更新しました", type: "success" });
      } else {
        // 新しいレビューを追加
        const newReview: ReviewRecord = {
          ...reviewData,
          userId,
          id: `review_${Date.now()}`,
          createdAt: now,
          updatedAt: now,
        };
        setReviews((prev) => [...prev, newReview]);
        setToast({ message: "レビューを投稿しました", type: "success" });
      }

      setIsReviewFormOpen(false);
      setSelectedMovie(null);
      setEditingReview(null);
    } catch (error) {
      console.error("Error saving review:", error);
      setToast({ message: "投稿に失敗しました。時間をおいてお試しください。", type: "error" });
    }
  };

  const handleWriteReview = (movie: MovieSearchResult) => {
    // 認証チェック（簡易版 - 常に認証済みとして扱う）
    const userId = getUserId();

    // 既存レビューのチェック
    const existingReview = getExistingReview(movie.id);
    if (existingReview) {
      // 既存レビューがある場合は編集モードで開く
      setSelectedMovie(movie);
      setEditingReview(existingReview);
      setIsReviewFormOpen(true);
    } else {
      // 新規レビュー
      setSelectedMovie(movie);
      setEditingReview(null);
      setIsReviewFormOpen(true);
    }
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

  const handleAddToWatchlist = async (movie: MovieSearchResult, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    // 認証チェック（簡易版）
    const userId = getUserId();
    if (!userId) {
      setToast({ message: "ログインが必要です", type: "error" });
      return;
    }

    // 既に存在するかチェック
    if (watchlist.some((item) => item.id === movie.id)) {
      setToast({ message: "既に見たいリストに追加されています", type: "info" });
      return;
    }

    // オプティミスティックUI: 即座にUIを更新
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

    const previousWatchlist = [...watchlist];
    setWatchlist((prev) => [...prev, watchlistItem]);
    setWatchlistLoading((prev) => ({ ...prev, [movie.id]: true }));

    try {
      // APIリクエスト（将来的な実装）
      // const response = await fetch("/api/watchlist", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ movieId: movie.id, userId }),
      // });
      // if (!response.ok) throw new Error("Failed to add to watchlist");

      // 成功時のトースト通知
      setToast({ 
        message: `「${movie.title || movie.name}」を見たいリストに追加しました`, 
        type: "success" 
      });
    } catch (error) {
      // エラー時はロールバック
      setWatchlist(previousWatchlist);
      setToast({ 
        message: "操作に失敗しました。ログイン状態を確認してください。", 
        type: "error" 
      });
    } finally {
      setWatchlistLoading((prev) => {
        const newState = { ...prev };
        delete newState[movie.id];
        return newState;
      });
    }
  };

  const handleRemoveFromWatchlist = async (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    // 認証チェック（簡易版）
    const userId = getUserId();
    if (!userId) {
      setToast({ message: "ログインが必要です", type: "error" });
      return;
    }

    const item = watchlist.find((w) => w.id === id);
    const previousWatchlist = [...watchlist];

    // オプティミスティックUI: 即座にUIを更新
    setWatchlist((prev) => prev.filter((item) => item.id !== id));
    setWatchlistLoading((prev) => ({ ...prev, [id]: true }));

    try {
      // APIリクエスト（将来的な実装）
      // const response = await fetch(`/api/watchlist/${id}`, {
      //   method: "DELETE",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ userId }),
      // });
      // if (!response.ok) throw new Error("Failed to remove from watchlist");

      // 成功時のトースト通知
      setToast({ 
        message: `「${item?.title || ""}」を見たいリストから削除しました`, 
        type: "info" 
      });
    } catch (error) {
      // エラー時はロールバック
      setWatchlist(previousWatchlist);
      setToast({ 
        message: "操作に失敗しました。ログイン状態を確認してください。", 
        type: "error" 
      });
    } finally {
      setWatchlistLoading((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
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
        onSearchResults={(results) => {
          setSearchResults(results);
          setSearchError(null);
        }}
        onQueryChange={(query) => {
          setSearchQuery(query);
          setSearchPage(1);
          if (!query.trim()) {
            setSearchResults([]);
            setSearchError(null);
          }
        }}
        onError={(error) => {
          setSearchError(error);
        }}
        isLoading={isLoading}
      />
      <main className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* 人気/おすすめ映画カルーセル（検索結果がない場合のみ表示、検索バー直下） */}
        {!searchQuery.trim() && activeTab === "popular" && (
          <div className="mt-10 mb-8">
            {popularMovies.length > 0 && (
              <MovieCarousel
                title="🌍 世界の人気映画"
                movies={popularMovies}
                onMovieClick={setSelectedMovieForDetail}
              />
            )}
            {regionalPopularMovies.length > 0 && (
              <MovieCarousel
                title={countryCode === "JP" ? "🇯🇵 日本の人気映画" : countryCode === "US" ? "🇺🇸 アメリカの人気映画" : `📍 ${countryCode}の人気映画`}
                movies={regionalPopularMovies}
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
                <h2 className="text-xl font-semibold text-white">あなたに合わせたピックアップ</h2>
                {!isLoggedIn ? (
                  <div className="mt-4 rounded-lg border border-amber-400/50 bg-amber-400/10 p-4">
                    <p className="text-amber-400 mb-3">
                      ログインしてパーソナライズされたおすすめを見る
                    </p>
                    <button
                      onClick={() => {
                        // 簡易的なログイン処理（実際の実装では認証モーダルを表示）
                        if (typeof window !== "undefined") {
                          const userId = `user_${Date.now()}`;
                          localStorage.setItem("cinelog_userId", userId);
                          setIsLoggedIn(true);
                          setToast({ message: "ログインしました", type: "success" });
                        }
                      }}
                      className="rounded-lg bg-amber-400 px-6 py-2 font-medium text-black transition-colors hover:bg-amber-300"
                    >
                      ログイン
                    </button>
                  </div>
                ) : watchlist.length === 0 ? (
                  <p className="text-sm text-zinc-400 mt-2">
                    まだ見たいリストに映画がありません。映画を検索して追加すると、あなたのためのおすすめが表示されます。
                  </p>
                ) : (
                  <p className="text-sm text-zinc-400 mt-2">{t.recommendationSub}</p>
                )}
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
                      isInWatchlist={isMovieInWatchlist(movie.id)}
                      onToggleWatchlist={(movie, e) => {
                        if (isMovieInWatchlist(movie.id)) {
                          handleRemoveFromWatchlist(movie.id, e);
                        } else {
                          handleAddToWatchlist(movie, e);
                        }
                      }}
                      isWatchlistLoading={watchlistLoading[movie.id] || false}
                    />
                  </div>
                ))}
              </div>
            ) : searchError && searchQuery.trim() ? (
              <div className="rounded-lg border border-red-400/50 bg-red-400/10 p-4 text-red-400">
                <p className="font-medium">⚠️ {searchError}</p>
              </div>
            ) : !isLoading && !error && searchQuery.trim() && searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="mb-4 text-6xl">🎬</span>
                <p className="text-zinc-400">「{searchQuery}」の検索結果は見つかりませんでした。</p>
              </div>
            ) : activeTab === "recommended" && !searchQuery.trim() && !isLoading && displayMovies.length === 0 && isLoggedIn && watchlist.length > 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="mb-4 text-6xl">🎬</span>
                <p className="text-zinc-400">おすすめ映画が見つかりませんでした</p>
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* レビューフォーム */}
      {isReviewFormOpen && selectedMovie && (
        <ReviewForm
          movie={selectedMovie}
          existingReview={editingReview}
          onSave={handleSaveReview}
          onClose={() => {
            setIsReviewFormOpen(false);
            setSelectedMovie(null);
            setEditingReview(null);
          }}
          onError={(error) => {
            setToast({ message: error, type: "error" });
          }}
        />
      )}

      {/* トースト通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* 映画詳細モーダル */}
      {selectedMovieForDetail && (
        <MovieDetailModal
          movie={selectedMovieForDetail}
          isInWatchlist={isMovieInWatchlist(selectedMovieForDetail.id)}
          existingReview={getExistingReview(selectedMovieForDetail.id)}
          onClose={() => setSelectedMovieForDetail(null)}
          onAddToWatchlist={handleAddToWatchlist}
          onRemoveFromWatchlist={handleRemoveFromWatchlist}
          onWriteReview={handleWriteReview}
        />
      )}

      {/* 更新チェッカー */}
      <UpdateChecker />
    </div>
  );
}
