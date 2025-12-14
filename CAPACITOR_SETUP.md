# Capacitor セットアップガイド

このアプリをiOS/Androidネイティブアプリとしてビルドするための手順です。

## 前提条件

- Node.js 20以上
- macOS（iOS開発の場合）: Xcodeが必要
- Android開発の場合: Android Studioが必要

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、TMDB APIキーを設定：

```env
NEXT_PUBLIC_TMDB_API_KEY=your_api_key_here
```

### 3. 静的エクスポートの設定（Capacitor用）

Capacitorでネイティブアプリをビルドする場合、Next.jsを静的エクスポートする必要があります。

`next.config.ts`のコメントを外して有効化：

```typescript
const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};
```

**注意**: 静的エクスポートを有効にすると、Vercelでの通常のデプロイに影響する可能性があります。開発時のみ有効化することを推奨します。

### 4. ビルドとエクスポート

```bash
npm run build
```

これで`out`ディレクトリに静的ファイルが生成されます。

### 5. iOSプラットフォームの追加

```bash
npx cap add ios
npx cap sync
```

### 6. Androidプラットフォームの追加

```bash
npx cap add android
npx cap sync
```

### 7. ネイティブプロジェクトを開く

**iOS:**
```bash
npx cap open ios
```

**Android:**
```bash
npx cap open android
```

### 8. 開発時のライブリロード設定（オプション）

`capacitor.config.ts`に以下を追加：

```typescript
const config: CapacitorConfig = {
  // ... 既存の設定
  server: {
    url: 'http://YOUR_LOCAL_IP:3000',
    cleartext: true,
  },
};
```

これにより、開発サーバーから直接読み込むことができ、ホットリロードが可能になります。

## App Storeへの公開

### iOS App Store

1. **Apple Developer Programへの登録**（年間$99）
   - [developer.apple.com](https://developer.apple.com/programs/) で登録

2. **Xcodeでの設定**
   - プロジェクトを開く: `npx cap open ios`
   - Signing & Capabilitiesで開発者アカウントを設定
   - Bundle Identifierを確認

3. **アーカイブとアップロード**
   - Product → Archive
   - OrganizerからApp Store Connectにアップロード

4. **App Store Connectでの設定**
   - [appstoreconnect.apple.com](https://appstoreconnect.apple.com/) でアプリ情報を設定
   - 審査に提出

### Google Play Store

1. **Google Play Consoleアカウント作成**（$25の初回登録料）

2. **Android Studioでの設定**
   - プロジェクトを開く: `npx cap open android`
   - 署名キーを生成
   - Releaseビルドを作成

3. **アプリバンドルのアップロード**
   - Google Play Consoleでアプリを作成
   - アプリバンドルをアップロード
   - ストア情報を設定して公開

## 注意事項

- **Vercelデプロイ**: 静的エクスポートを有効にすると、Vercelの通常のデプロイ機能が制限される可能性があります
- **環境変数**: ネイティブアプリでは、`NEXT_PUBLIC_`プレフィックスの環境変数がビルド時に埋め込まれます
- **API制限**: TMDB APIの利用制限に注意してください

## トラブルシューティング

### ビルドエラーが発生する場合

1. `node_modules`を削除して再インストール
2. Capacitorのキャッシュをクリア: `npx cap sync`
3. ネイティブプロジェクトを再生成

### 画像が表示されない場合

- `next.config.ts`で`images.unoptimized: true`が設定されているか確認
- 画像URLが正しく生成されているか確認


