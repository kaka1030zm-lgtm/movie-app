"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Search, Star, Bookmark, Film, Play, Info, User, LogOut } from "lucide-react";
import CineLogLogo from "./components/CineLogLogo";
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
import {
  getAllReviewsDB,
  saveReviewDB,
  updateReviewDB,
  deleteReviewDB,
  getReviewByMovieIdDB,
} from "@/lib/reviews-db";
import { getPopularMovies, getPopularTVShows } from "@/lib/tmdb";
import { getWatchlist, removeFromWatchlist, WatchlistItem } from "@/lib/watchlist";
import {
  getWatchlistDB,
  addToWatchlistDB,
  removeFromWatchlistDB,
  isInWatchlistDB,
} from "@/lib/watchlist-db";
import { getRecommendedMovies } from "@/lib/recommendations";

type TabType = "popular" | "reviews" | "watchlist";

export default function Home() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("popular");
  const [selectedMovie, setSelectedMovie] = useState<MovieSearchResult | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [popularMovies, setPopularMovies] = useState<MovieSearchResult[]>([]);
  const [popularTVShows, setPopularTVShows] = useState<MovieSearchResult[]>([]);
  const [regionalMovies, setRegionalMovies] = useState<MovieSearchResult[]>([]);
  const [regionalTVShows, setRegionalTVShows] = useState<MovieSearchResult[]>([]);
  const [recommendedMovies, setRecommendedMovies] = useState<MovieSearchResult[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);
  const [isLoadingPopularTV, setIsLoadingPopularTV] = useState(false);
  const [isLoadingRegional, setIsLoadingRegional] = useState(false);
  const [isLoadingRegionalTV, setIsLoadingRegionalTV] = useState(false);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
  const [userCountry, setUserCountry] = useState<string>("JP");
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [originElement, setOriginElement] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; reviewId: string | null }>({
    isOpen: false,
    reviewId: null,
  });
  const [watchlistDeleteConfirm, setWatchlistDeleteConfirm] = useState<{ isOpen: boolean; movieId: number | null }>({
    isOpen: false,
    movieId: null,
  });
  const [hasSearchResults, setHasSearchResults] = useState(false);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  // スワイプ用の状態
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const swipeThreshold = 50; // スワイプ判定の最小距離（px）

  // タブの順序
  const tabs: TabType[] = ["popular", "reviews", "watchlist"];

  // スワイプハンドラー
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // 縦スクロールを妨げないように、横方向のスワイプのみを処理
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const touchCurrentX = e.touches[0].clientX;
    const touchCurrentY = e.touches[0].clientY;
    const deltaX = Math.abs(touchCurrentX - touchStartX.current);
    const deltaY = Math.abs(touchCurrentY - touchStartY.current);
    
    // 横方向のスワイプが縦方向より大きい場合のみ処理
    if (deltaX > deltaY && deltaX > 10) {
      e.preventDefault(); // 縦スクロールを防ぐ
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = Math.abs(touchEndY - touchStartY.current);
    
    // 横方向のスワイプが縦方向より大きく、かつ閾値を超えている場合のみ処理
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > swipeThreshold) {
      const currentIndex = tabs.indexOf(activeTab);
      
      if (deltaX < 0 && currentIndex < tabs.length - 1) {
        // 左にスワイプ → 次のタブ
        setActiveTab(tabs[currentIndex + 1]);
      } else if (deltaX > 0 && currentIndex > 0) {
        // 右にスワイプ → 前のタブ
        setActiveTab(tabs[currentIndex - 1]);
      }
    }
    
    touchStartX.current = null;
    touchStartY.current = null;
  }, [activeTab]);

  // 国コードから国旗と国名を取得
  const getCountryFlag = (countryCode: string): string => {
    const flags: { [key: string]: string } = {
      JP: "🇯🇵",
      US: "🇺🇸",
      GB: "🇬🇧",
      KR: "🇰🇷",
      CN: "🇨🇳",
      FR: "🇫🇷",
      DE: "🇩🇪",
      IT: "🇮🇹",
      ES: "🇪🇸",
      CA: "🇨🇦",
      AU: "🇦🇺",
      BR: "🇧🇷",
      IN: "🇮🇳",
      MX: "🇲🇽",
    };
    return flags[countryCode] || "🌍";
  };

  const getCountryName = (countryCode: string): string => {
    const names: { [key: string]: string } = {
      JP: "日本",
      US: "アメリカ",
      GB: "イギリス",
      KR: "韓国",
      CN: "中国",
      FR: "フランス",
      DE: "ドイツ",
      IT: "イタリア",
      ES: "スペイン",
      CA: "カナダ",
      AU: "オーストラリア",
      BR: "ブラジル",
      IN: "インド",
      MX: "メキシコ",
    };
    return names[countryCode] || "国内";
  };

  // 見たいリストを読み込む
  const loadWatchlist = useCallback(async () => {
    if (status === "loading") return;
    
    try {
      if (session?.user?.id) {
        // ログイン済み: データベースから取得
        try {
          const response = await fetch("/api/watchlist");
          if (response.ok) {
            const items = await response.json();
            const sorted = items.sort((a: WatchlistItem, b: WatchlistItem) => 
              new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
            );
            setWatchlist(sorted);
            return;
          } else if (response.status === 401) {
            // 認証エラーの場合はローカルストレージから取得
            const localItems = getWatchlist();
            const sorted = localItems.sort((a, b) => 
              new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
            );
            setWatchlist(sorted);
            return;
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error("Error loading watchlist from database:", error);
          }
          // フォールバック: ローカルストレージから取得
          const localItems = getWatchlist();
          const sorted = localItems.sort((a, b) => 
            new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
          );
          setWatchlist(sorted);
          return;
        }
      } else {
        // 未ログイン: ローカルストレージから取得
        const items = getWatchlist();
        const sorted = items.sort((a, b) => 
          new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
        );
        setWatchlist(sorted);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error in loadWatchlist:", error);
      }
      // エラー時もローカルストレージから取得を試みる
      try {
        const items = getWatchlist();
        const sorted = items.sort((a, b) => 
          new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
        );
        setWatchlist(sorted);
      } catch (localError) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error loading from local storage:", localError);
        }
        setWatchlist([]);
      }
    }
    
    // 見たいリストが更新されたら、おすすめ映画も再計算（useEffectで処理）
    // loadRecommendedMoviesは別のuseEffectで処理されるため、ここでは呼び出さない
  }, [session, status]);

  // レビューを読み込む
  useEffect(() => {
    loadReviews();
  }, [session, status]);

  // ユーザーの国を取得
  useEffect(() => {
    const fetchUserCountry = async () => {
      try {
        const response = await fetch("/api/country");
        if (response.ok) {
          const data = await response.json();
          setUserCountry(data.countryCode || "JP");
        } else {
          setUserCountry("JP"); // フォールバック
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching user country:", error);
        }
        setUserCountry("JP"); // フォールバック
      }
    };
    fetchUserCountry();
  }, []);

  // 人気映画を読み込む
  useEffect(() => {
    loadPopularMovies();
  }, []);

  // 人気ドラマを読み込む
  useEffect(() => {
    loadPopularTVShows();
  }, []);

  // 国内人気映画を読み込む
  useEffect(() => {
    if (userCountry && popularMovies.length > 0) {
      loadRegionalMovies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCountry, popularMovies.length]);

  // 国内人気ドラマを読み込む
  useEffect(() => {
    if (userCountry && popularTVShows.length > 0) {
      loadRegionalTVShows();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCountry, popularTVShows.length]);

  // 見たいリストを読み込む（useEffect）
  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  // おすすめ映画を読み込む
  useEffect(() => {
    // 見たいリストが変更されたとき、または必要なデータが揃ったときに再計算
    // すべてのデータが揃っている必要はないが、最低限popularMoviesは必要
    if (popularMovies.length > 0) {
      loadRecommendedMovies();
    }
  }, [watchlist.length, popularMovies.length, popularTVShows.length, regionalMovies.length, regionalTVShows.length]);

  // タブの下線位置を更新（useCallbackでメモ化）
  const updateUnderlinePosition = useCallback(() => {
    const activeTabButton = tabRefs.current[activeTab];
    if (activeTabButton) {
      const parent = activeTabButton.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        const buttonRect = activeTabButton.getBoundingClientRect();
        setUnderlineStyle({
          left: buttonRect.left - parentRect.left,
          width: buttonRect.width,
        });
      }
    }
  }, [activeTab]);


  useEffect(() => {
    updateUnderlinePosition();
    // ウィンドウリサイズ時にも更新（デバウンス付き）
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateUnderlinePosition, 100);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, [updateUnderlinePosition]);

  const loadReviews = async () => {
    if (status === "loading") return;
    
    if (session?.user?.id) {
      // ログイン済み: データベースから取得
      try {
        const response = await fetch("/api/reviews");
        if (response.ok) {
          const allReviews = await response.json();
          setReviews(
            allReviews.sort(
              (a: Review, b: Review) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          );
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error loading reviews from database:", error);
        }
        // フォールバック: ローカルストレージから取得
        const allReviews = getAllReviews();
        setReviews(
          allReviews.sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        );
      }
    } else {
      // 未ログイン: ローカルストレージから取得
      const allReviews = getAllReviews();
      setReviews(
        allReviews.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    }
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

  const loadPopularTVShows = async () => {
    setIsLoadingPopularTV(true);
    try {
      const tvShows = await getPopularTVShows();
      setPopularTVShows(
        tvShows.map((tv) => ({
          id: tv.id,
          title: tv.title || tv.name || "",
          poster_path: tv.poster_path,
          release_date: tv.release_date || tv.first_air_date || null,
          overview: tv.overview,
          vote_average: tv.vote_average,
          popularity: tv.popularity,
          genres: tv.genres,
          media_type: "tv" as "movie" | "tv",
        }))
      );
    } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error loading popular TV shows:", error);
        }
    } finally {
      setIsLoadingPopularTV(false);
    }
  };

  const loadRegionalMovies = async () => {
    setIsLoadingRegional(true);
    try {
      if (!userCountry) {
        setIsLoadingRegional(false);
        return;
      }
      
      // /discover/movieを使用してより確実に国内映画を取得
      const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      if (!apiKey) {
            if (process.env.NODE_ENV === "development") {
              console.error("TMDB API key is not set");
            }
        setRegionalMovies([]);
        return;
      }
      
      const allMovies: any[] = [];
      const popularMovieIds = new Set(popularMovies.map((m) => m.id));
      
      // その国の人々に人気のある作品を取得（その国が作成した作品だけでなく、海外作品も含む）
      // regionパラメータを使用することで、その地域で人気の作品を取得できる
      const maxPages = 10; // パフォーマンス向上のためページ数を削減
      let foundEnough = false;
      
      for (let page = 1; page <= maxPages && !foundEnough; page++) {
        try {
          // regionパラメータを使用して、その国の人々に人気のある作品を取得
          const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=ja-JP&region=${userCountry}&sort_by=popularity.desc&page=${page}`;
          
          const response = await fetch(url);
          
          if (response.ok) {
            const data = await response.json();
            const results = (data.results || []) as any[];
            
            // 世界の人気映画と重複しないものを追加（Setを使用して高速化）
            const uniqueMovies = results.filter((movie: any) => 
              !popularMovieIds.has(movie.id) &&
              !allMovies.some((m) => m.id === movie.id) // 重複チェック
            );
            
            if (uniqueMovies.length > 0) {
              allMovies.push(...uniqueMovies);
              // 30件以上集まったら終了
              if (allMovies.length >= 30) {
                foundEnough = true;
                break;
              }
            }
            
            // 次のページがない場合は終了
            if (page >= (data.total_pages || 1)) {
              foundEnough = true;
              break;
            }
          } else {
            if (process.env.NODE_ENV === "development") {
              console.error(`Failed to fetch page ${page}: ${response.statusText}`);
            }
            // エラーが発生しても次のページを試す
            continue;
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error(`Error fetching page ${page}:`, error);
          }
          // エラーが発生しても次のページを試す
          continue;
        }
      }
      
      // マッピング
      const filtered = allMovies.map((movie: any) => ({
        id: movie.id,
        title: movie.title || movie.name || "",
        poster_path: movie.poster_path,
        release_date: movie.release_date || movie.first_air_date || null,
        overview: movie.overview,
        vote_average: movie.vote_average,
        popularity: movie.popularity,
        genres: movie.genres,
        media_type: (movie.media_type || "movie") as "movie" | "tv",
      }));
      
      setRegionalMovies(filtered.slice(0, 30));
    } catch (error) {
      console.error("Error loading regional movies:", error);
      setRegionalMovies([]);
    } finally {
      setIsLoadingRegional(false);
    }
  };

  const loadRegionalTVShows = async () => {
    setIsLoadingRegionalTV(true);
    try {
      if (!userCountry) {
        setIsLoadingRegionalTV(false);
        return;
      }
      const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      if (!apiKey) {
            if (process.env.NODE_ENV === "development") {
              console.error("TMDB API key is not set");
            }
        setRegionalTVShows([]);
        return;
      }
      
      // その国の人々に人気のあるドラマを取得（その国が作成した作品だけでなく、海外作品も含む）
      // アニメを除外
      const allTVShows: any[] = [];
      const popularTVIds = new Set(popularTVShows.map((tv) => tv.id));
      // アニメのジャンルID: 16 (Animation)
      const ANIME_GENRE_IDS = [16];
      // アニメ関連のキーワード（タイトルや概要に含まれる場合）
      const ANIME_KEYWORDS = ['anime', 'アニメ', 'アニメーション'];
      
      let page = 1;
      const maxPages = 20; // パフォーマンス向上のためページ数を削減
      
      while (allTVShows.length < 30 && page <= maxPages) {
        try {
          // regionパラメータを使用して、その国の人々に人気のあるドラマを取得（アニメを除外）
          const url = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=ja-JP&watch_region=${userCountry}&without_genres=${ANIME_GENRE_IDS.join(',')}&sort_by=popularity.desc&page=${page}`;
          
          const response = await fetch(url);
          
          if (response.ok) {
            const data = await response.json();
            const results = (data.results || []) as any[];
            
            // 追加のフィルタリング：アニメを除外し、世界の人気ドラマと重複しないものを追加
            const regionalTVs = results.filter((tv: any) => {
              // 世界の人気ドラマと重複しない
              if (popularTVIds.has(tv.id)) return false;
              
              // 既に追加済みでないことを確認
              if (allTVShows.some((t) => t.id === tv.id)) return false;
              
              // アニメを除外（genre_idsに16が含まれていない）
              const genreIds = tv.genre_ids || [];
              const isAnime = genreIds.some((id: number) => ANIME_GENRE_IDS.includes(id));
              if (isAnime) {
                return false;
              }
              
              // タイトルや概要にアニメ関連のキーワードが含まれていないか確認
              const title = (tv.name || tv.title || "").toLowerCase();
              const overview = (tv.overview || "").toLowerCase();
              const hasAnimeKeyword = ANIME_KEYWORDS.some(keyword => 
                title.includes(keyword) || overview.includes(keyword)
              );
              if (hasAnimeKeyword) {
                return false;
              }
              
              return true;
            });
            
            allTVShows.push(...regionalTVs);
            
            // 30件以上集まったら終了
            if (allTVShows.length >= 30) {
              break;
            }
            
            // 次のページがない場合は終了
            if (page >= (data.total_pages || 1)) {
              break;
            }
            
            page++;
          } else {
            if (process.env.NODE_ENV === "development") {
              console.error(`Failed to fetch page ${page}: ${response.statusText}`);
            }
            // エラーが発生しても次のページを試す
            page++;
            continue;
          }
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error(`Error fetching page ${page}:`, error);
          }
          // エラーが発生しても次のページを試す
          page++;
          continue;
        }
      }
      
      // マッピング
      const filtered = allTVShows.map((tv: any) => ({
        id: tv.id,
        title: tv.name || tv.title || "",
        poster_path: tv.poster_path,
        release_date: tv.first_air_date || tv.release_date || null,
        overview: tv.overview,
        vote_average: tv.vote_average,
        popularity: tv.popularity,
        genres: tv.genres,
        media_type: "tv" as "movie" | "tv",
      }));
      
      console.log(`Final regional TV shows count: ${filtered.length} for ${userCountry}`);
      setRegionalTVShows(filtered.slice(0, 30));
    } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error loading regional TV shows:", error);
        }
      setRegionalTVShows([]);
    } finally {
      setIsLoadingRegionalTV(false);
    }
  };

  const loadRecommendedMovies = async () => {
    setIsLoadingRecommended(true);
    try {
      // 人気映画・ドラマと国内映画・ドラマのIDを収集（配列として保持、Setは内部で使用）
      const excludeIds = [
        ...popularMovies.map((m) => m.id),
        ...popularTVShows.map((tv) => tv.id),
        ...regionalMovies.map((m) => m.id),
        ...regionalTVShows.map((tv) => tv.id),
      ];

      if (watchlist.length === 0) {
        console.log("Watchlist is empty, loading fallback recommendations");
        // 見たいリストが空の場合、世界の人気映画の31位から30件を表示
        // Page 1: 1-20位, Page 2: 21-40位, Page 3: 41-60位
        // 31位から30件 = Page 2の後半10件(31-40位) + Page 3の前半20件(41-60位)
        try {
          const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
          if (!apiKey) {
            setRecommendedMovies([]);
            return;
          }
          
          const [page2, page3] = await Promise.all([
            fetch(
              `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=ja-JP&page=2`
            ),
            fetch(
              `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=ja-JP&page=3`
            ),
          ]);

          if (page2.ok && page3.ok) {
            const data2 = await page2.json();
            const data3 = await page3.json();
            // Page 2の後半10件（21-30位のうち、31-40位に相当する部分）
            // 実際にはPage 2は21-40位なので、後半10件（インデックス10-19）が31-40位
            const page2Last10 = (data2.results || []).slice(10, 20); // 31-40位
            const page3First20 = (data3.results || []).slice(0, 20); // 41-60位
            const allMovies = [...page2Last10, ...page3First20];
            
            const filtered = allMovies
              .filter((movie: any) => !excludeIds.includes(movie.id))
              .slice(0, 30)
              .map((movie: any) => ({
                id: movie.id,
                title: movie.title || movie.name || "",
                poster_path: movie.poster_path,
                release_date: movie.release_date || movie.first_air_date || null,
                overview: movie.overview,
                vote_average: movie.vote_average,
                popularity: movie.popularity,
                genres: movie.genres,
                media_type: (movie.media_type || "movie") as "movie" | "tv",
              }));
            
            setRecommendedMovies(filtered);
          } else {
            setRecommendedMovies([]);
          }
        } catch (error) {
          console.error("Error loading fallback recommendations:", error);
          setRecommendedMovies([]);
        }
      } else {
        // 見たいリストがある場合、ジャンルと公開日ベースでおすすめを取得
        // 現在の見たいリストを渡す（ログイン済みの場合はDBから、未ログインの場合はローカルストレージから）
        const movies = await getRecommendedMovies(excludeIds, watchlist);
        
        // 30件に満たない場合は世界の人気映画の31位以降を追加
        if (movies.length < 30) {
          try {
            const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
            if (apiKey) {
              const needed = 30 - movies.length;
              const movieIds = new Set([...Array.from(excludeIds), ...movies.map((m) => m.id)]);
              
              // 31位以降から必要な分だけ取得
              let page = 2; // Page 2から開始（31位以降）
              let offset = 10; // Page 2の後半10件（31-40位）から開始
              const additionalMovies: MovieSearchResult[] = [];
              
              while (additionalMovies.length < needed && page <= 5) {
                const response = await fetch(
                  `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=ja-JP&page=${page}`
                );
                
                if (response.ok) {
                  const data = await response.json();
                  const results = (data.results || []) as any[];
                  
                  for (let i = offset; i < results.length && additionalMovies.length < needed; i++) {
                    const movie = results[i];
                    if (!movieIds.has(movie.id)) {
                      additionalMovies.push({
                        id: movie.id,
                        title: movie.title || movie.name || "",
                        poster_path: movie.poster_path,
                        release_date: movie.release_date || movie.first_air_date || null,
                        overview: movie.overview,
                        vote_average: movie.vote_average,
                        popularity: movie.popularity,
                        genres: movie.genres || [],
                        media_type: (movie.media_type || "movie") as "movie" | "tv",
                      });
                      movieIds.add(movie.id);
                    }
                  }
                  
                  page++;
                  offset = 0; // 次のページからは最初から
                } else {
                  break;
                }
              }
              
              setRecommendedMovies([...movies, ...additionalMovies].slice(0, 30));
            } else {
              setRecommendedMovies(movies);
            }
          } catch (error) {
            if (process.env.NODE_ENV === "development") {
              console.error("Error loading additional movies:", error);
            }
            setRecommendedMovies(movies);
          }
        } else {
          setRecommendedMovies(movies);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error loading recommended movies:", error);
      }
      setRecommendedMovies([]);
    } finally {
      setIsLoadingRecommended(false);
    }
  };

  const handleMovieSelect = async (movie: MovieSearchResult, event?: React.MouseEvent) => {
    // ポスター画像の位置を正確に取得
    if (event?.currentTarget) {
      const clickedElement = event.currentTarget as HTMLElement;
      // ポスター画像を探す（imgタグまたはその親のaspect-[2/3]要素）
      let posterElement: HTMLElement | null = null;
      
      // まず、aspect-[2/3]の親要素を探す
      const aspectContainer = clickedElement.querySelector('[class*="aspect-[2/3]"]') as HTMLElement;
      if (aspectContainer) {
        // その中からimgタグを探す
        const img = aspectContainer.querySelector('img') as HTMLElement;
        if (img) {
          posterElement = img;
        } else {
          // imgがない場合は、aspect-[2/3]の要素自体を使用
          posterElement = aspectContainer;
        }
      } else {
        // aspect-[2/3]が見つからない場合は、クリックされた要素内の最初のimgを探す
        const img = clickedElement.querySelector('img') as HTMLElement;
        if (img) {
          posterElement = img;
        } else {
          // imgも見つからない場合は、クリックされた要素自体を使用
          posterElement = clickedElement;
        }
      }
      
      if (posterElement) {
        const rect = posterElement.getBoundingClientRect();
        setOriginElement({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setOriginElement(null);
      }
    } else {
      setOriginElement(null);
    }
    
    setSelectedMovie(movie);
    
    // レビューを取得（ログイン済みの場合はデータベースから、未ログインの場合はローカルストレージから）
    if (session?.user?.id) {
      try {
        const response = await fetch(`/api/reviews/by-movie?movieId=${movie.id}`);
        if (response.ok) {
          const existing = await response.json();
          setEditingReview(existing);
        } else {
          setEditingReview(null);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching review:", error);
        }
        // フォールバック: ローカルストレージから取得
        const existing = getReviewByMovieId(movie.id);
        setEditingReview(existing);
      }
    } else {
      const existing = getReviewByMovieId(movie.id);
      setEditingReview(existing);
    }
    
    setIsFormOpen(true);
  };

  const handleSaveReview = async (reviewInput: ReviewInput) => {
    if (session?.user?.id) {
      // ログイン済み: データベースに保存
      try {
        if (editingReview) {
          const response = await fetch("/api/reviews", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reviewId: editingReview.id, ...reviewInput }),
          });
          if (response.ok) {
            loadReviews();
          }
        } else {
          const response = await fetch("/api/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reviewInput),
          });
          if (response.ok) {
            loadReviews();
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error saving review to database:", error);
        }
        // フォールバック: ローカルストレージに保存
        if (editingReview) {
          updateReview(editingReview.id, reviewInput);
        } else {
          saveReview(reviewInput);
        }
        loadReviews();
      }
    } else {
      // 未ログイン: ローカルストレージに保存
      if (editingReview) {
        updateReview(editingReview.id, reviewInput);
      } else {
        saveReview(reviewInput);
      }
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
    setOriginElement(null);
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

  const confirmDelete = async () => {
    if (!deleteConfirm.reviewId) {
      setDeleteConfirm({ isOpen: false, reviewId: null });
      return;
    }

    if (session?.user?.id) {
      // ログイン済み: データベースから削除
      try {
        const response = await fetch(`/api/reviews?reviewId=${deleteConfirm.reviewId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          loadReviews();
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error deleting review from database:", error);
        }
        // フォールバック: ローカルストレージから削除
        if (deleteReview(deleteConfirm.reviewId)) {
          loadReviews();
        }
      }
    } else {
      // 未ログイン: ローカルストレージから削除
      if (deleteReview(deleteConfirm.reviewId)) {
        loadReviews();
      }
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

  const confirmWatchlistDelete = async () => {
    if (!watchlistDeleteConfirm.movieId) {
      setWatchlistDeleteConfirm({ isOpen: false, movieId: null });
      return;
    }

    if (session?.user?.id) {
      // ログイン済み: データベースから削除
      try {
        const response = await fetch(`/api/watchlist?movieId=${watchlistDeleteConfirm.movieId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          loadWatchlist();
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error deleting from watchlist database:", error);
        }
        // フォールバック: ローカルストレージから削除
        if (removeFromWatchlist(watchlistDeleteConfirm.movieId)) {
          loadWatchlist();
        }
      }
    } else {
      // 未ログイン: ローカルストレージから削除
      if (removeFromWatchlist(watchlistDeleteConfirm.movieId)) {
        loadWatchlist();
      }
    }
    
    setWatchlistDeleteConfirm({ isOpen: false, movieId: null });
  };

  const handleReviewMovieClick = (review: Review, event?: React.MouseEvent) => {
    const movie: MovieSearchResult = {
      id: review.movie_id,
      title: review.movie_title,
      poster_path: review.movie_poster_path,
      release_date: review.movie_release_date,
      overview: null,
      media_type: "movie",
    };
    handleMovieSelect(movie, event);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* ヘッダー */}
      <header className="border-b border-[#1a1a1a] bg-black/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* ロゴ */}
              <CineLogLogo size="md" />
              {/* アプリ名と副題 */}
              <div className="flex flex-col">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#D4AF37] leading-tight" style={{ fontFamily: 'var(--font-playfair), serif' }}>CineLog</h1>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5 leading-tight">映画体験を、美しく刻む。</p>
              </div>
            </div>
            
            {/* ログイン/ログアウトボタン */}
            <div className="flex items-center gap-2">
              {status === "loading" ? (
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
              ) : session?.user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 text-sm text-gray-300">
                    <User className="h-4 w-4" />
                    <span>{session.user.email}</span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] text-gray-300 hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition-all"
                    title="ログアウト"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">ログアウト</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] text-black font-semibold hover:bg-[#B8941F] transition-colors"
                  title="ログイン"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">ログイン</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {/* Tabs - PC表示（アイコン中心） */}
        {!hasSearchResults && (
          <div className="mb-8 border-b border-zinc-800/30 hidden md:block">
            <div className="flex gap-2 relative">
              <button
                ref={(el) => (tabRefs.current["popular"] = el)}
                onClick={() => setActiveTab("popular")}
                className={`group relative px-4 py-3 font-medium transition-all duration-300 rounded-t-lg border-r border-zinc-800/20 ${
                  activeTab === "popular"
                    ? "text-[#D4AF37] bg-[#D4AF37]/10"
                    : "text-gray-400 hover:text-gray-300 hover:bg-[#1a1a1a]"
                }`}
                title="映画/ドラマを探す"
              >
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  <span className="text-sm">{activeTab === "popular" ? "探す" : ""}</span>
                </div>
              </button>
              <button
                ref={(el) => (tabRefs.current["reviews"] = el)}
                onClick={() => setActiveTab("reviews")}
                className={`group relative px-4 py-3 font-medium transition-all duration-300 rounded-t-lg border-r border-zinc-800/20 ${
                  activeTab === "reviews"
                    ? "text-[#D4AF37] bg-[#D4AF37]/10"
                    : "text-gray-400 hover:text-gray-300 hover:bg-[#1a1a1a]"
                }`}
                title="マイレビュー"
              >
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  <span className="text-sm">{activeTab === "reviews" ? "レビュー" : ""}</span>
                  {reviews.length > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === "reviews" 
                        ? "bg-[#D4AF37] text-black" 
                        : "bg-gray-600 text-white"
                    }`}>
                      {reviews.length}
                    </span>
                  )}
                </div>
              </button>
              <button
                ref={(el) => (tabRefs.current["watchlist"] = el)}
                onClick={() => setActiveTab("watchlist")}
                className={`group relative px-4 py-3 font-medium transition-all duration-300 rounded-t-lg ${
                  activeTab === "watchlist"
                    ? "text-[#D4AF37] bg-[#D4AF37]/10"
                    : "text-gray-400 hover:text-gray-300 hover:bg-[#1a1a1a]"
                }`}
                title="見たいリスト"
              >
                <div className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5" />
                  <span className="text-sm">{activeTab === "watchlist" ? "リスト" : ""}</span>
                  {watchlist.length > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === "watchlist" 
                        ? "bg-[#D4AF37] text-black" 
                        : "bg-gray-600 text-white"
                    }`}>
                      {watchlist.length}
                    </span>
                  )}
                </div>
              </button>
              {/* スライドする下線 */}
              <span
                className="absolute bottom-0 h-0.5 bg-[#D4AF37] transition-all duration-300 ease-in-out"
                style={{
                  left: `${underlineStyle.left}px`,
                  width: `${underlineStyle.width}px`,
                }}
              />
            </div>
          </div>
        )}

        {/* 検索セクション - 映画/ドラマを探すタブのときだけ表示 */}
        {!hasSearchResults && activeTab === "popular" && (
          <div 
            className="mb-12 transition-all duration-300 ease-out"
            style={{
              opacity: activeTab === "popular" ? 1 : 0,
              transform: activeTab === "popular" ? "translateY(0)" : "translateY(-10px)",
            }}
          >
            <MovieSearch 
              onMovieSelect={handleMovieSelect} 
              onSearchStateChange={setHasSearchResults}
            />
          </div>
        )}

        {/* Tab content - hidden when search results are displayed */}
        {!hasSearchResults && (
          <div className="relative">
          <div
            className={`transition-all duration-300 ease-out will-change-transform ${
              activeTab === "popular"
                ? "opacity-100 translate-x-0 relative z-10"
                : "opacity-0 translate-x-4 absolute inset-0 pointer-events-none z-0"
            }`}
            style={{ 
              transform: activeTab === "popular" ? "translateX(0)" : "translateX(16px)",
              transition: "opacity 300ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            {isLoadingPopular ? (
              <div className="flex justify-center items-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* 1. おすすめ映画（一番上） */}
                {!isLoadingRecommended && recommendedMovies.length > 0 && (
                  <PopularMoviesCarousel
                    movies={recommendedMovies}
                    onMovieSelect={handleMovieSelect}
                    title="⭐ あなたへのおすすめ"
                  />
                )}
                
                {/* 2. 世界の人気映画 */}
                <PopularMoviesCarousel
                  movies={popularMovies}
                  onMovieSelect={handleMovieSelect}
                  title="世界の人気映画"
                />
                
                {/* 3. 世界の人気ドラマ */}
                {isLoadingPopularTV ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
                  </div>
                ) : popularTVShows.length > 0 ? (
                  <PopularMoviesCarousel
                    movies={popularTVShows}
                    onMovieSelect={handleMovieSelect}
                    title="世界の人気ドラマ"
                  />
                ) : null}
                
                {/* 4. 国内人気映画 */}
                {isLoadingRegional ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
                  </div>
                ) : regionalMovies.length > 0 ? (
                  <PopularMoviesCarousel
                    movies={regionalMovies}
                    onMovieSelect={handleMovieSelect}
                    title={`${getCountryFlag(userCountry)} ${getCountryName(userCountry)}の人気映画`}
                  />
                ) : null}

                {/* 5. 国内人気ドラマ */}
                {isLoadingRegionalTV ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
                  </div>
                ) : regionalTVShows.length > 0 ? (
                  <PopularMoviesCarousel
                    movies={regionalTVShows}
                    onMovieSelect={handleMovieSelect}
                    title={`${getCountryFlag(userCountry)} ${getCountryName(userCountry)}の人気ドラマ`}
                  />
                ) : null}
              </div>
            )}
          </div>

          <div
            className={`transition-all duration-300 ease-out will-change-transform ${
              activeTab === "reviews"
                ? "opacity-100 translate-x-0 relative z-10"
                : "opacity-0 -translate-x-4 absolute inset-0 pointer-events-none z-0"
            }`}
            style={{ 
              transform: activeTab === "reviews" ? "translateX(0)" : "translateX(-16px)",
              transition: "opacity 300ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            <ReviewList
              reviews={reviews}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMovieClick={handleReviewMovieClick}
            />
          </div>

          <div
            className={`transition-all duration-300 ease-out will-change-transform ${
              activeTab === "watchlist"
                ? "opacity-100 translate-x-0 relative z-10"
                : "opacity-0 translate-x-4 absolute inset-0 pointer-events-none z-0"
            }`}
            style={{ 
              transform: activeTab === "watchlist" ? "translateX(0)" : "translateX(16px)",
              transition: "opacity 300ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms cubic-bezier(0.4, 0, 0.2, 1)"
            }}
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
          reviewId={editingReview?.id || null}
          onSave={handleSaveReview}
          onCancel={handleCancel}
          onDelete={handleDelete}
          onWatchlistChange={loadWatchlist}
          originElement={originElement}
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

      {/* スマホ用下部ナビゲーションバー（アイコン中心） */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-[#1a1a1a] z-50 md:hidden">
        <div className="flex items-center justify-around h-16">
          {/* 映画を探す */}
          <button
            onClick={() => {
              setActiveTab("popular");
              setHasSearchResults(false);
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative ${
              activeTab === "popular"
                ? "text-[#D4AF37]"
                : "text-gray-400"
            }`}
            title="映画/ドラマを探す"
          >
            <div className={`p-2 rounded-lg transition-all duration-300 ${
              activeTab === "popular" ? "bg-[#D4AF37]/20" : ""
            }`}>
              <Search className="h-6 w-6" />
            </div>
          </button>

          {/* マイレビュー */}
          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative ${
              activeTab === "reviews"
                ? "text-[#D4AF37]"
                : "text-gray-400"
            }`}
            title="マイレビュー"
          >
            <div className={`p-2 rounded-lg transition-all duration-300 relative ${
              activeTab === "reviews" ? "bg-[#D4AF37]/20" : ""
            }`}>
              <Star className="h-6 w-6" />
              {reviews.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {reviews.length > 9 ? "9+" : reviews.length}
                </span>
              )}
            </div>
          </button>

          {/* 見たいリスト */}
          <button
            onClick={() => setActiveTab("watchlist")}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative ${
              activeTab === "watchlist"
                ? "text-[#D4AF37]"
                : "text-gray-400"
            }`}
            title="見たいリスト"
          >
            <div className={`p-2 rounded-lg transition-all duration-300 relative ${
              activeTab === "watchlist" ? "bg-[#D4AF37]/20" : ""
            }`}>
              <Bookmark className="h-6 w-6" />
              {watchlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {watchlist.length > 9 ? "9+" : watchlist.length}
                </span>
              )}
            </div>
          </button>
        </div>
      </nav>
    </div>
  );
}
