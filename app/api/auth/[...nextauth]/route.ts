import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import EmailProvider from "next-auth/providers/email";
import { createTransport } from "nodemailer";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-for-development-only",
  providers: [
    EmailProvider({
      server: process.env.SMTP_HOST
        ? {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
            },
          }
        : {
            host: "localhost",
            port: 587,
            auth: {
              user: "dev",
              pass: "dev",
            },
          },
      from: process.env.SMTP_FROM || "noreply@cinelog.app",
      async sendVerificationRequest({ identifier, url, provider }) {
        try {
          // 開発環境: コンソールにURLを出力
          if (!process.env.SMTP_HOST) {
            console.log("\n=== ログインリンク ===");
            console.log(`メールアドレス: ${identifier}`);
            console.log(`ログインURL: ${url}`);
            console.log("===================\n");
            return;
          }

          const transport = createTransport(provider.server);
          const result = await transport.sendMail({
            to: identifier,
            from: provider.from,
            subject: `CineLog ログイン`,
            text: `CineLogにログインするには、以下のリンクをクリックしてください:\n\n${url}\n\nこのリンクは24時間有効です。`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a; color: #ffffff;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #D4AF37; font-size: 28px; margin: 0;">CineLog</h1>
                  <p style="color: #999; margin-top: 5px;">映画体験を、美しく刻む。</p>
                </div>
                <div style="background-color: #1a1a1a; padding: 30px; border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.3);">
                  <h2 style="color: #D4AF37; margin-top: 0;">ログインリンク</h2>
                  <p style="color: #ccc; line-height: 1.6;">
                    CineLogにログインするには、以下のボタンをクリックしてください：
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${url}" 
                       style="display: inline-block; background-color: #D4AF37; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      ログイン
                    </a>
                  </div>
                  <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #333; padding-top: 20px;">
                    このリンクは24時間有効です。<br>
                    このメールに心当たりがない場合は、無視してください。
                  </p>
                  <p style="color: #666; font-size: 11px; margin-top: 10px;">
                    または、以下のURLをブラウザにコピー&ペーストしてください：<br>
                    <a href="${url}" style="color: #D4AF37; word-break: break-all;">${url}</a>
                  </p>
                </div>
              </div>
            `,
          });
          const failed = result.rejected.concat(result.pending).filter(Boolean);
          if (failed.length) {
            throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`);
          }
        } catch (error: any) {
          // 詳細なエラーログを出力
          console.error("メール送信エラー:", error);
          if (error.response) {
            console.error("SMTPレスポンス:", error.response);
          }
          if (error.code) {
            console.error("エラーコード:", error.code);
          }
          if (error.command) {
            console.error("失敗したコマンド:", error.command);
          }
          
          // 開発環境ではエラーを無視してコンソールに出力
          if (!process.env.SMTP_HOST) {
            console.log("\n=== ログインリンク（エラー時フォールバック）===");
            console.log(`メールアドレス: ${identifier}`);
            console.log(`ログインURL: ${url}`);
            console.log("===================\n");
            return;
          }
          
          // エラーメッセージを改善
          let errorMessage = "メール送信に失敗しました";
          if (error.code === "EAUTH") {
            errorMessage = "SMTP認証に失敗しました。ユーザー名とパスワードを確認してください。";
          } else if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
            errorMessage = "SMTPサーバーに接続できませんでした。ホストとポートを確認してください。";
          } else if (error.response) {
            errorMessage = `SMTPエラー: ${error.response}`;
          }
          
          // エラーを再スロー（NextAuthが適切に処理する）
          const enhancedError = new Error(errorMessage);
          (enhancedError as any).originalError = error;
          throw enhancedError;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-email",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "database",
  },
});

export const { GET, POST } = handlers;
