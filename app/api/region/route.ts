import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Vercelのヘッダーから国コードを取得
    const countryCode = request.headers.get("x-vercel-ip-country") || 
                        request.headers.get("cf-ipcountry") || 
                        "JP"; // デフォルトは日本

    return NextResponse.json({ countryCode });
  } catch (error) {
    console.error("Error getting region:", error);
    // エラー時もデフォルトでJPを返す
    return NextResponse.json({ countryCode: "JP" });
  }
}
