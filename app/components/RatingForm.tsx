"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Star, X, Film, Users, Video, Bookmark, BookmarkCheck, Trash2 } from "lucide-react";
import { MovieSearchResult, RatingCriteria, ReviewInput } from "@/types/movie";
import { getPosterUrl, getBackdropUrl, getMovieDetails } from "@/lib/tmdb";
import { calculateOverallRating, convertToStarRating } from "@/lib/reviews";
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from "@/lib/watchlist";

interface RatingFormProps {
  movie: MovieSearchResult | null;
  existingReview?: {
    ratings: RatingCriteria;
    comment: string | null;
  } | null;
  reviewId?: string | null;
  onSave: (review: ReviewInput) => void;
  onCancel: () => void;
  onDelete?: (reviewId: string) => void;
  onWatchlistChange?: () => void;
  originElement?: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

const RATING_CRITERIA = [
  { key: "story" as const, label: "ストーリー" },
  { key: "acting" as const, label: "演技" },
  { key: "direction" as const, label: "演出" },
  { key: "cinematography" as const, label: "映像美" },
  { key: "music" as const, label: "音楽" },
] as const;

export default function RatingForm({
  movie,
  existingReview,
  reviewId,
  onSave,
  onCancel,
  onDelete,
  onWatchlistChange,
  originElement,
}: RatingFormProps) {
  const { data: session } = useSession();
  const [ratings, setRatings] = useState<RatingCriteria>({
    story: 5,
    acting: 5,
    direction: 5,
    cinematography: 5,
    music: 5,
    overall: 5,
  });
  const [comment, setComment] = useState("");
  const [movieDetails, setMovieDetails] = useState<{
    genres?: { id: number; name: string }[];
    director?: { name: string } | null;
    cast?: { name: string }[];
    backdrop_path?: string | null;
    vote_average?: number;
    watch_providers?: {
      flatrate?: { provider_id: number; provider_name: string; logo_path: string | null }[];
    };
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isInWatchlistState, setIsInWatchlistState] = useState(false);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const [backdropImageLoaded, setBackdropImageLoaded] = useState(false);

  // 背景スクロールを無効化
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    if (existingReview) {
      setRatings(existingReview.ratings);
      setComment(existingReview.comment || "");
    } else {
      setRatings({
        story: 5,
        acting: 5,
        direction: 5,
        cinematography: 5,
        music: 5,
        overall: 5,
      });
      setComment("");
    }
  }, [existingReview, movie]);

  // アニメーション管理（簡素化）
  useEffect(() => {
    if (isAnimating && !isClosing) {
      // アニメーション開始後、すぐに中央に移動（時間を短縮）
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, isClosing]);

  // 見たいリストの状態を確認
  useEffect(() => {
    if (movie) {
      if (session?.user?.id) {
        // ログイン済み: データベースから確認
        fetch(`/api/watchlist/check?movieId=${movie.id}`)
          .then((res) => res.json())
          .then((data) => setIsInWatchlistState(data.isInWatchlist))
          .catch(() => setIsInWatchlistState(isInWatchlist(movie.id))); // フォールバック
      } else {
        // 未ログイン: ローカルストレージから確認
        setIsInWatchlistState(isInWatchlist(movie.id));
      }
    }
  }, [movie, session]);

  // 映画詳細を取得
  useEffect(() => {
    if (!movie) return;

    setIsLoadingDetails(true);
    setBackdropImageLoaded(false); // 新しい映画が選択されたらリセット
    const mediaType = movie.media_type || "movie";
    getMovieDetails(movie.id, mediaType)
      .then((details) => {
        const director = details.credits?.crew?.find(
          (person) => person.job === "Director"
        );
        const mainCast = details.credits?.cast?.slice(0, 3) || [];

        const jpProviders = details.watch_providers?.results?.JP;
        setMovieDetails({
          genres: details.genres || [],
          director: director ? { name: director.name } : null,
          cast: mainCast.map((person) => ({ name: person.name })),
          backdrop_path: details.backdrop_path,
          vote_average: details.vote_average,
          watch_providers: jpProviders?.flatrate ? { flatrate: jpProviders.flatrate } : undefined,
        });
      })
      .catch((error) => {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching movie details:", error);
        }
      })
      .finally(() => {
        setIsLoadingDetails(false);
      });
  }, [movie]);

  if (!movie) return null;

  const updateRating = (key: keyof RatingCriteria, value: number) => {
    const newRatings = { ...ratings, [key]: value };
    // 総合評価は常に各項目の平均値から自動計算
    const overall = calculateOverallRating(newRatings);
    setRatings({ ...newRatings, overall });
  };

  const overallRating = ratings.overall;
  const starRating = convertToStarRating(overallRating);

  const handleWatchlistToggle = async () => {
    if (!movie || isWatchlistLoading) return;

    setIsWatchlistLoading(true);
    try {
      if (session?.user?.id) {
        // ログイン済み: データベースに保存
        if (isInWatchlistState) {
          const response = await fetch(`/api/watchlist?movieId=${movie.id}`, {
            method: "DELETE",
          });
          if (response.ok) {
            setIsInWatchlistState(false);
          }
        } else {
          const response = await fetch("/api/watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(movie),
          });
          if (response.ok) {
            setIsInWatchlistState(true);
          }
        }
      } else {
        // 未ログイン: ローカルストレージに保存
        if (isInWatchlistState) {
          removeFromWatchlist(movie.id);
          setIsInWatchlistState(false);
        } else {
          addToWatchlist(movie);
          setIsInWatchlistState(true);
        }
      }
      if (onWatchlistChange) {
        onWatchlistChange();
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error toggling watchlist:", error);
      }
    } finally {
      setIsWatchlistLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const overallRating = calculateOverallRating(ratings);
    const reviewInput: ReviewInput = {
      movie_id: movie.id,
      movie_title: movie.title,
      movie_poster_path: movie.poster_path,
      movie_release_date: movie.release_date,
      ratings: { ...ratings, overall: overallRating },
      comment: comment.trim() || null,
    };

    onSave(reviewInput);
    // 保存後に閉じるモーションを開始
    setIsClosing(true);
    setIsAnimating(true);
    setTimeout(() => {
      onCancel();
    }, 300);
  };

  const posterUrl = getPosterUrl(movie.poster_path);
  const backdropUrl = getBackdropUrl(movieDetails?.backdrop_path || null);
  const backgroundImageUrl = backdropUrl || posterUrl;

  // ジャンルからテーマカラーを決定
  const getThemeColor = (): string => {
    if (!movieDetails?.genres || movieDetails.genres.length === 0) {
      return "#8B0000"; // デフォルト: 暗い赤
    }

    const genreNames = movieDetails.genres.map((g) => g.name.toLowerCase());
    
    // ジャンルに基づいて色を決定
    if (genreNames.some((g) => g.includes("アクション") || g.includes("action"))) {
      return "#DC143C"; // クリムゾンレッド
    }
    if (genreNames.some((g) => g.includes("ホラー") || g.includes("horror"))) {
      return "#4B0082"; // インディゴ
    }
    if (genreNames.some((g) => g.includes("スリラー") || g.includes("thriller"))) {
      return "#1a1a2e"; // 暗い青
    }
    if (genreNames.some((g) => g.includes("サイエンスフィクション") || g.includes("science fiction") || g.includes("sci-fi"))) {
      return "#4A148C"; // 深い紫
    }
    if (genreNames.some((g) => g.includes("ドラマ") || g.includes("drama"))) {
      return "#2C1810"; // 暗い茶色
    }
    if (genreNames.some((g) => g.includes("コメディ") || g.includes("comedy"))) {
      return "#FF6B35"; // オレンジ
    }
    if (genreNames.some((g) => g.includes("ロマンス") || g.includes("romance"))) {
      return "#C2185B"; // ピンク
    }
    
    return "#8B0000"; // デフォルト: 暗い赤
  };

  const themeColor = getThemeColor();
  const releaseDate = movie.release_date
    ? movie.release_date.split("T")[0] // YYYY-MM-DD形式
    : null;

  const handleCancel = () => {
    setIsClosing(true);
    setIsAnimating(true);
    setTimeout(() => {
      onCancel();
    }, 500);
  };

  const backdropImageUrl = movieDetails?.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movieDetails.backdrop_path}`
    : null;

  // アニメーション用のスタイルを計算（ポスター画像の位置を正確にトラッキング）
  const getModalStyle = () => {
    if (!originElement) {
      // 位置情報がない場合は通常の中央表示
      return {
        transform: isClosing ? "scale(0.95)" : "scale(1)",
        opacity: isClosing ? 0 : 1,
      };
    }

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const originX = originElement.x + originElement.width / 2;
    const originY = originElement.y + originElement.height / 2;
    
    // モーダルの実際のサイズを考慮した精密なスケール計算
    const modalMaxWidth = Math.min(window.innerWidth * 0.9, 1280);
    const modalMaxHeight = Math.min(window.innerHeight * 0.85, 800);
    
    // ポスターのアスペクト比（2:3）を考慮
    const posterAspectRatio = originElement.width / originElement.height;
    const modalAspectRatio = modalMaxWidth / modalMaxHeight;
    
    // より精密なスケール計算（ポスターのサイズとモーダルのサイズを正確に比較）
    let scaleX = originElement.width / modalMaxWidth;
    let scaleY = originElement.height / modalMaxHeight;
    
    // アスペクト比の違いを考慮して調整
    if (posterAspectRatio < modalAspectRatio) {
      // ポスターの方が縦長の場合、幅基準でスケール
      scaleX = originElement.width / modalMaxWidth;
      scaleY = (originElement.width / modalAspectRatio) / modalMaxHeight;
    } else {
      // ポスターの方が横長の場合、高さ基準でスケール
      scaleX = (originElement.height * modalAspectRatio) / modalMaxWidth;
      scaleY = originElement.height / modalMaxHeight;
    }
    
    // 初期スケールを計算（最小値は0.08、最大値は0.2に制限）
    const initialScale = Math.max(0.08, Math.min(Math.min(scaleX, scaleY), 0.2));
    
    if (isAnimating && !isClosing) {
      // 開く時: ポスターの位置から開始
      return {
        transform: `translate(${originX - centerX}px, ${originY - centerY}px) scale(${initialScale})`,
        transformOrigin: "center center",
      };
    }

    if (isClosing) {
      // 閉じる時: ポスターの位置に戻る
      return {
        transform: `translate(${originX - centerX}px, ${originY - centerY}px) scale(${initialScale})`,
        transformOrigin: "center center",
        opacity: 0,
      };
    }

    // 中央に到達した状態
    return {
      transform: "translate(0, 0) scale(1)",
      transformOrigin: "center center",
    };
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
    >
      {/* モーダル外側の背景 */}
      <div className={`absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-none transition-opacity duration-300 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`} />

      {/* コンテナ全体（背景画像とグラデーションを含む） */}
      <div
        className="relative w-full max-w-5xl overflow-hidden rounded-xl bg-zinc-900/80 backdrop-blur-md text-white shadow-2xl min-h-[500px] max-h-[85vh] flex flex-col"
        style={{
          ...getModalStyle(),
          transition: isAnimating || isClosing 
            ? "transform 200ms ease-out, opacity 200ms ease-out"
            : "transform 200ms ease-out, opacity 200ms ease-out",
          willChange: "transform, opacity",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 背景色のベース */}
        <div className="absolute inset-0 bg-zinc-950 pointer-events-none" />

        {/* 2. コンテンツレイヤー（前面） */}
        <div className="relative z-10 flex flex-col gap-6 p-6 md:p-10 overflow-y-auto custom-scrollbar flex-1">
          {/* 背景画像（コンテンツと一緒にスクロール） */}
          {backdropImageUrl && backdropImageLoaded && (
            <div className="absolute top-0 left-0 right-0 w-full pointer-events-none" style={{ zIndex: -1, minHeight: '100%' }}>
              <img
                src={backdropImageUrl}
                alt=""
                className="w-full object-cover object-top opacity-50"
                style={{ 
                  minHeight: '100%',
                  height: 'auto',
                  width: '100%'
                }}
              />
              {/* グラデーションオーバーレイ */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/40 to-transparent" />
              {/* 画像下部の自然なグラデーション */}
              <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent via-zinc-950/50 to-zinc-950" />
            </div>
          )}

          {/* 上部：ポスターと基本情報 */}
          <div className="flex flex-col md:flex-row md:items-start md:gap-10">
            {/* 左カラム：ポスター画像（大きく表示、影付き） */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="w-52 aspect-[2/3] rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] md:w-72 object-cover"
                />
              ) : (
                <div className="w-52 aspect-[2/3] md:w-72 bg-[#2a2a2a] rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                  <Film className="h-16 w-16 text-gray-600" />
                </div>
              )}
            </div>

            {/* 右カラム：情報 */}
            <div className="flex flex-1 flex-col gap-6 mt-6 md:mt-0">
            {/* タイトルと公開日 */}
            <div>
              <div className="text-sm font-bold tracking-wider text-yellow-500 uppercase">Selected Movie</div>
              <h2 className="mt-1 text-4xl font-extrabold text-white md:text-5xl">{movie.title}</h2>
              {releaseDate && (
                <p className="mt-2 text-zinc-300">{releaseDate} 公開</p>
              )}
              {/* TMDB評価（星表示） */}
              {movieDetails?.vote_average !== undefined && movieDetails.vote_average > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const rating = movieDetails.vote_average! / 2; // 10点満点を5点満点に変換
                      const filled = star <= rating;
                      const halfFilled = star - 1 < rating && rating < star;
                      return (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            filled
                              ? "fill-[#D4AF37] text-[#D4AF37]"
                              : halfFilled
                              ? "fill-[#D4AF37]/50 text-[#D4AF37]"
                              : "fill-zinc-700/30 text-zinc-700/30"
                          }`}
                          strokeWidth={filled || halfFilled ? 0 : 1.5}
                        />
                      );
                    })}
                  </div>
                  <span className="text-sm text-zinc-400">
                    {movieDetails.vote_average.toFixed(1)} / 10
                  </span>
                </div>
              )}
            </div>

            {/* ジャンル */}
            {movieDetails?.genres && movieDetails.genres.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {movieDetails.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-2 py-1 text-xs bg-[#D4AF37]/20 text-[#D4AF37] rounded-full"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {/* 監督と主演 */}
            {(movieDetails?.director || movieDetails?.cast) && (
              <div className="flex flex-col gap-2 text-sm text-zinc-300">
                {movieDetails?.director && (
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-[#D4AF37]" />
                    <span>監督: {movieDetails.director.name}</span>
                  </div>
                )}
                {movieDetails?.cast && movieDetails.cast.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#D4AF37]" />
                    <span>主演: {movieDetails.cast.map((c) => c.name).join(", ")}</span>
                  </div>
                )}
              </div>
            )}

            {/* 配信情報 */}
            {movieDetails?.watch_providers?.flatrate && movieDetails.watch_providers.flatrate.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-zinc-400">配信:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {movieDetails.watch_providers.flatrate.map((provider) => (
                    <div
                      key={provider.provider_id}
                      className="w-8 h-8 rounded bg-white/10 flex items-center justify-center overflow-hidden"
                      title={provider.provider_name}
                    >
                      {provider.logo_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                          alt={provider.provider_name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">{provider.provider_name.charAt(0)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 見たいリストボタン */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleWatchlistToggle}
                disabled={isWatchlistLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300 ${
                  isInWatchlistState
                    ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/30"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]"
                } ${isWatchlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isWatchlistLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : isInWatchlistState ? (
                  <>
                    <BookmarkCheck className="h-5 w-5" />
                    <span className="text-sm font-medium">追加済み</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="h-5 w-5" />
                    <span className="text-sm font-medium">見たいリストに追加</span>
                  </>
                )}
              </button>
            </div>
            </div>
          </div>

          {/* 下部：あらすじ・詳細評価（ポスターの下から横に広がる） */}
          <div className="flex flex-col gap-6 mt-6">
            {/* あらすじ（背景色を薄く） */}
            {movie.overview && (
              <div className="rounded-lg bg-black/10 p-4 text-zinc-100 backdrop-blur-sm leading-relaxed">
                {movie.overview}
              </div>
            )}

            {/* 評価フォームエリア（背景色を追加） */}
            <form onSubmit={handleSubmit} className="grid gap-6 p-6 bg-zinc-900/40 rounded-lg backdrop-blur-sm">
              {/* 各項目の評価（スライダー） */}
              <div className="space-y-6">
                <label className="block text-sm font-medium text-zinc-300">
                  詳細評価（1-10点）
                </label>
                {RATING_CRITERIA.map((criterion) => (
                  <div key={criterion.key}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-300">{criterion.label}</span>
                      <span className="text-sm font-semibold text-[#D4AF37]">
                        {ratings[criterion.key]}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={ratings[criterion.key]}
                      onChange={(e) =>
                        updateRating(criterion.key, parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                    />
                  </div>
                ))}
              </div>

              {/* コメント */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  コメント
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={6}
                  placeholder="この映画についての感想を書いてください..."
                  className="w-full rounded-lg border border-zinc-800 bg-black/40 px-4 py-3 text-white placeholder-zinc-500 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 resize-none backdrop-blur-sm"
                />
              </div>

              {/* ボタン（キャンセル更新削除の順） */}
              <div className="flex gap-3 pt-4 border-t border-zinc-800/50">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 rounded-lg border-2 border-zinc-800 px-4 py-3 text-white hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/50 transition-all duration-300"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-3 text-black font-semibold hover:bg-[#B8941F] transition-colors border-2 border-[#D4AF37]"
                >
                  {existingReview ? "更新" : "保存"}
                </button>
                {existingReview && reviewId && onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("このレビューを削除しますか？この操作は取り消せません。")) {
                        onDelete(reviewId);
                        onCancel();
                      }
                    }}
                    className="rounded-lg border-2 border-red-500/50 bg-red-500/10 px-4 py-3 text-red-400 hover:bg-red-500/20 hover:border-red-500 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>削除</span>
                  </button>
                )}
              </div>
            </form>

            {/* 閉じるボタン（右上） */}
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 p-2 rounded-lg bg-black/40 backdrop-blur-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


