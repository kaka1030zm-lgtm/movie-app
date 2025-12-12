"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold text-red-400">重大なエラーが発生しました</h2>
            <p className="mb-4 text-zinc-400">{error.message}</p>
            <button
              onClick={reset}
              className="rounded-lg bg-amber-400 px-6 py-3 font-medium text-black transition-colors hover:bg-amber-300"
            >
              再試行
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
