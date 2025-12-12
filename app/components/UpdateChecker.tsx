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

  const handleReload = () => {
    // キャッシュをクリアしてリロード
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
    window.location.reload();
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border border-amber-400/50 bg-amber-400/10 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-amber-400">新しいバージョンが利用可能です</p>
          <p className="text-sm text-zinc-400">更新を適用しますか？</p>
        </div>
        <button
          onClick={handleReload}
          className="ml-4 rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-amber-300"
        >
          更新
        </button>
      </div>
    </div>
  );
}
