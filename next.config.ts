import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発環境でのクロスオリジンリクエストを許可
  allowedDevOrigins: ["192.168.11.3", "localhost"],
};

export default nextConfig;
