import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発環境でのクロスオリジンリクエストを許可
  allowedDevOrigins: ["192.168.11.3", "localhost"],
  // Capacitor用の設定（静的エクスポートが必要な場合のみ有効化）
  // output: 'export',
  // images: {
  //   unoptimized: true,
  // },
};

export default nextConfig;
