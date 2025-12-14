# 認証機能のセットアップ

CineLogでは、NextAuthを使用したメールアドレス認証を実装しています。

## セットアップ手順

### 1. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
# NextAuth設定（必須）
AUTH_SECRET=your-secret-key-here
# または
NEXTAUTH_SECRET=your-secret-key-here

# データベース設定（SQLite）
DATABASE_URL="file:./dev.db"

# SMTP設定（本番環境でメール送信する場合）
# 開発環境では設定不要（コンソールにログインリンクが表示されます）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@cinelog.app
```

### Gmailを使用する場合の設定方法

Gmailでメール送信を行うには、以下の手順が必要です：

1. **Googleアカウントで2段階認証を有効にする**
   - [Googleアカウントのセキュリティ設定](https://myaccount.google.com/security)にアクセス
   - 「2段階認証プロセス」を有効にする

2. **アプリパスワードを生成する**
   - [アプリパスワードのページ](https://myaccount.google.com/apppasswords)にアクセス
   - 「アプリを選択」→「メール」を選択
   - 「デバイスを選択」→「その他（カスタム名）」を選択し、「CineLog」などと入力
   - 「生成」をクリックして16文字のアプリパスワードを取得

3. **環境変数を設定する**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # 生成したアプリパスワード（スペースは削除）
   SMTP_FROM=your-email@gmail.com  # 送信元メールアドレス
   ```

**注意事項：**
- Gmailの通常のパスワードではなく、**アプリパスワード**を使用してください
- アプリパスワードにはスペースが含まれていますが、環境変数にはスペースなしで設定してください
- 2段階認証が有効でない場合、アプリパスワードは生成できません

# TMDB API Key
NEXT_PUBLIC_TMDB_API_KEY=your-tmdb-api-key-here
```

### 2. AUTH_SECRETの生成

以下のコマンドでランダムなシークレットキーを生成できます：

```bash
openssl rand -base64 32
```

### 3. データベースの初期化

```bash
npx prisma generate
npx prisma migrate deploy
```

### 4. 開発環境での動作確認

開発環境では、SMTP設定がなくても動作します。ログインリンクはコンソールに表示されます。

## 機能

- **メールアドレス認証**: メールアドレスを入力すると、ログインリンクが送信されます
- **アカウント同期**: ログインすると、レビューと見たいリストがデータベースに保存され、同じアカウントで複数のデバイスからアクセス可能です
- **フォールバック**: 未ログイン時はローカルストレージを使用します

## 使用方法

1. ヘッダーの「ログイン」ボタンをクリック
2. メールアドレスを入力
3. メールに送信されたログインリンクをクリック
4. ログイン後、レビューと見たいリストが自動的に同期されます
