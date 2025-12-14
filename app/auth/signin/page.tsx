"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import CineLogLogo from "../../components/CineLogLogo";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const result = await signIn("email", {
        email: email.trim(),
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        // エラーメッセージを詳細化
        const errorMessage = result.error === "Configuration" 
          ? "サーバー設定に問題があります。管理者にお問い合わせください。"
          : result.error === "AccessDenied"
          ? "アクセスが拒否されました。"
          : result.error === "Verification"
          ? "メール送信に失敗しました。メールアドレスを確認してください。"
          : "ログインに失敗しました。メールアドレスを確認してください。";
        setError(errorMessage);
        console.error("認証エラー:", result.error);
      } else if (result?.ok) {
        setSuccess(true);
      } else {
        // okでもerrorでもない場合（通常は成功）
        setSuccess(true);
      }
    } catch (err) {
      console.error("認証例外:", err);
      setError("エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CineLogLogo size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-[#D4AF37] mb-2" style={{ fontFamily: 'var(--font-playfair), serif' }}>CineLog</h1>
          <p className="text-gray-400">映画体験を、美しく刻む。</p>
        </div>

        {/* ログインフォーム */}
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-8">
          {success ? (
            <div className="text-center">
              <div className="mb-4">
                <Mail className="h-16 w-16 text-[#D4AF37] mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">確認メールを送信しました</h2>
              <p className="text-gray-400 mb-6">
                {email} にログインリンクを送信しました。<br />
                メール内のリンクをクリックしてログインしてください。
              </p>
              <button
                onClick={() => router.push("/")}
                className="w-full bg-[#D4AF37] text-black font-semibold py-3 rounded-lg hover:bg-[#B8941F] transition-colors"
              >
                ホームに戻る
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-6 text-center">ログイン</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    メールアドレス
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#D4AF37] text-black font-semibold py-3 rounded-lg hover:bg-[#B8941F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "送信中..." : "ログインリンクを送信"}
                </button>
              </form>

              <p className="mt-6 text-xs text-gray-500 text-center">
                初めての方は、メールアドレスを入力すると自動的にアカウントが作成されます。
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
