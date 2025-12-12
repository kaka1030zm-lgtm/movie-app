This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

このアプリをVercelにデプロイして、スマホからアクセスできるようにする手順：

### 方法1: Vercel Web UIからデプロイ（推奨）

1. **GitHubにリポジトリを作成**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Vercelにログイン**
   - [vercel.com](https://vercel.com) にアクセス
   - GitHubアカウントでログイン

3. **プロジェクトをインポート**
   - 「Add New Project」をクリック
   - GitHubリポジトリを選択
   - プロジェクト設定を確認（Next.jsは自動検出されます）

4. **環境変数を設定**
   - プロジェクト設定 → 「Environment Variables」
   - 以下の環境変数を追加：
     - `NEXT_PUBLIC_TMDB_API_KEY`: あなたのTMDB APIキー
   - 「Save」をクリック

5. **デプロイ**
   - 「Deploy」をクリック
   - デプロイ完了後、URLが表示されます（例: `https://your-app.vercel.app`）

### 方法2: Vercel CLIからデプロイ

1. **Vercel CLIをインストール**
   ```bash
   npm i -g vercel
   ```

2. **ログイン**
   ```bash
   vercel login
   ```

3. **デプロイ**
   ```bash
   vercel
   ```

4. **環境変数を設定**
   ```bash
   vercel env add NEXT_PUBLIC_TMDB_API_KEY
   ```
   プロンプトに従ってAPIキーを入力

5. **本番環境にデプロイ**
   ```bash
   vercel --prod
   ```

### デプロイ後の確認

- デプロイが完了すると、VercelからURLが提供されます
- このURLをスマホのブラウザで開けば、どこからでもアクセスできます
- PCがオフでも、Vercelのサーバー上で動作するため、24時間アクセス可能です

### 注意事項

- TMDB APIキーは環境変数として設定してください（`.env.local`はGitにコミットしないでください）
- ローカルストレージのデータはブラウザごとに保存されるため、デバイス間で共有されません
- デプロイ後も、コードを更新してGitHubにプッシュすると、自動的に再デプロイされます

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
