# うるるといえ 詩集

起動: `npm install` → `npm run dev` ／ ビルド: `npm run build`（`dist/` をVercelへ）

## 構成
- `src/data/songs.js` 同梱の歌詞データ（原稿から抽出。保存先未設定時、および取得失敗時の表示元）
- `src/lib/theme.js` デザイン設定の既定値と選択肢（編集画面の項目はここに集約）
- `src/styles/` 固定のタイポ設計値と共通CSS ／ `src/views.jsx` 表紙・目次・歌詞 ／ `src/admin/` 編集画面
- `src/lib/store.js` Supabaseの読み書き ／ `supabase/schema.sql` テーブルとアクセス制限

## 保存と認証（Supabase）
1. Supabaseでプロジェクト作成 → SQL Editorで `supabase/schema.sql` を実行（メールアドレスを本人のものに置換）
2. Authentication > Users で本人のユーザーを作成（メール＋パスワード）。Authentication設定で **新規サインアップを無効化**
3. Vercelの環境変数に `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` を設定して再デプロイ
4. `https://（公開URL）/#/admin` を開いてログイン → 編集 → 「保存して公開に反映」

- 誰でも読める／書けるのは本人のログイン済みアカウントだけ（行レベルセキュリティ。URLを隠しているだけではない）
- 保存のたびに旧内容が `poetry_book_history` に残る（Supabaseの管理画面から復元可能）
- 環境変数が未設定なら、従来どおり `songs.js` の内容がそのまま表示される
- 初回の保存で、`songs.js` の内容がDBに書き込まれる
