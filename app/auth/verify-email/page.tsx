"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { useSearchParams } from "next/navigation";
import CineLogLogo from "../../components/CineLogLogo";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CineLogLogo size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-[#D4AF37] mb-2" style={{ fontFamily: 'var(--font-playfair), serif' }}>CineLog</h1>
        </div>

        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-8 text-center">
          <div className="mb-4">
            <Mail className="h-16 w-16 text-[#D4AF37] mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">確認メールを送信しました</h2>
          <p className="text-gray-400 mb-6">
            {email ? (
              <>
                {email} にログインリンクを送信しました。<br />
                メール内のリンクをクリックしてログインしてください。
              </>
            ) : (
              <>
                メールアドレスにログインリンクを送信しました。<br />
                メール内のリンクをクリックしてログインしてください。
              </>
            )}
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-[#D4AF37] text-black font-semibold py-3 rounded-lg hover:bg-[#B8941F] transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
