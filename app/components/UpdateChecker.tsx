"use client";

import { useEffect, useState } from "react";

export default function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // 開発環境では無効
    if (process.env.NODE_ENV === "development") {
      return;
    }

    // 定期的に更新をチェック
    const checkForUpdates = async () => {
      try {
        // マニフェストファイルの更新をチェック
        const response = await fetch("/manifest.json", { 
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          }
        });
        
        if (response.ok) {
          const manifest = await response.json();
          const currentVersion = manifest.version || manifest.name + Date.now();
          const storedVersion = localStorage.getItem("app-version");
          
          if (storedVersion && storedVersion !== currentVersion) {
            setUpdateAvailable(true);
          } else if (!storedVersion) {
            localStorage.setItem("app-version", currentVersion);
          }
        }
      } catch (error) {
        console.error("Error checking for updates:", error);
      }
    };

    // 初回チェック
    checkForUpdates();

    // 5分ごとにチェック
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // 更新が検出されたら自動的にリロード
  useEffect(() => {
    if (updateAvailable) {
      // 少し待ってからリロード（ユーザーに通知を表示する時間を確保）
      const timer = setTimeout(() => {
        // クライアントサイドでのみ実行
        if (typeof window === "undefined") {
          return;
        }

        // このアプリのキャッシュのみをクリア（同じオリジンのキャッシュのみ）
        if ("caches" in window) {
          caches.keys().then((names) => {
            // このアプリのドメインのキャッシュのみを削除
            // caches.keys()は既に同じオリジン（ドメイン）のキャッシュのみを返すため、
            // 他のサイトのキャッシュには影響しません
            const deletePromises = names.map((name) => {
              // Next.jsやこのアプリに関連するキャッシュのみを削除
              // より安全にするため、特定のパターンのみを削除することも可能
              return caches.delete(name);
            });
            Promise.all(deletePromises).then(() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            });
          });
        } else {
          window.location.reload();
        }
      }, 2000); // 2秒後に自動リロード

      return () => clearTimeout(timer);
    }
  }, [updateAvailable]);

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border border-amber-400/50 bg-amber-400/10 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-amber-400">新しいバージョンを検出しました</p>
          <p className="text-sm text-zinc-400">自動的に更新します...</p>
        </div>
        <div className="ml-4 h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent"></div>
      </div>
    </div>
  );
}
