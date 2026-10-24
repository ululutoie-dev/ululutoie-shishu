# うるるといえ 詩集

起動: `npm install` → `npm run dev` ／ ビルド: `npm run build`（GitHubへpush → 既存のVercelフローで公開）

## 画面
- `#/` 表紙 ／ `#/songs` 目次 ／ `#/songs/<id>` 歌詞（公開・ログイン不要）
- `#/admin` 歌詞の管理（管理者ログインが必要。どこからもリンクしていません）
- `#/design` デザイン調整（プレビューのみ。色・サイズ・余白は `src/lib/theme.js` に貼って反映）

## 構成
- `src/lib/theme.js` デザイン設定 ／ `src/styles/` 共通CSS ／ `src/views.jsx` 表紙・目次・歌詞（**公開ページと管理画面のプレビューで共通**）
- `src/lib/lyrics.js` 歌詞の扱い：改行＝次の行、空行＝段落の区切り（空行を重ねるほど広がる）。全角スペースは加工しない
- `src/lib/songs.js` 曲データの取得（Supabase。未設定・失敗・テーブルが空なら `src/data/songs.js` の同梱データで表示）
- `src/admin/` 管理画面（`save.js` 保存処理、`image.js` 写真の縮小）
- `supabase/schema.sql` テーブル・RLS・Storage ／ `supabase/seed.sql` 既存8曲の初回登録

## 歌詞の組版ルール
- 入力した文字列はそのまま保存・表示します（自動整形・句読点やスペースの補正なし）。表示は `white-space: pre-wrap`。
- 行頭の全角スペース＝字下げ、行の途中の全角スペース＝言葉の間隔。連続していても、そのまま表示します。
- 空行とは「何も書かれていない行」です。全角スペースだけの行は、字下げ・間隔として入力された行なので空行にはなりません。
- 画面幅による折り返しは、続きの行を字下げ＋1字ぶん下げて、入力した改行と見分けられるようにしています。
- 「全角スペースを改行にする」ボタンは、押したときだけ、その曲の下書きを書き換えます（保存するまで公開されず、「読み込み時の内容に戻す」で戻せます）。

## セットアップ（Supabase）
1. Supabaseでプロジェクトを作成。
2. SQL Editorで `supabase/schema.sql` を実行（何度実行しても安全）。
3. Authentication > Sign In / Providers で **新規サインアップを無効化**。Authentication > Users で自分のユーザーを作成（メール＋パスワード）。
4. 管理者として登録（SQL Editorで、メールアドレスを自分のものに変えて実行）:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'YOUR_EMAIL@example.com'
   on conflict do nothing;
   ```
5. 既存8曲の登録（どちらか一方でよい。何度実行しても重複しない）:
   - SQL Editorで `supabase/seed.sql` を実行、または
   - 管理画面（`#/admin`）の「同梱の8曲を取り込む」ボタン。
6. 環境変数 `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY`（Project Settings > API の anon public）を、ローカルは `.env.local`、Vercelは Project Settings > Environment Variables に設定して再デプロイ。**service_role キーは絶対に使わない／コミットしない。**

## 権限（サーバー側で保護）
- `songs`：誰でも読める。追加・更新・削除は `public.is_admin()`（`admins` に登録された、ログイン済みのユーザー）のみ（RLS）。
- `song-photos`（Storage）：誰でも読める。アップロード・差し替え・削除は管理者のみ（Storageポリシー）。5MB・JPEG/PNG/WebPまで。
- `admins` にはポリシーがなく、API経由では読み書きできません。

## 保存の仕組み
「保存して公開に反映」で、写真アップロード → 曲の追加/更新 → 削除 → 古い写真の削除の順に反映します（複数の処理にまたがるため、途中で失敗した場合は画面のメッセージに従って再読み込みして確認してください）。同時に複数の画面から編集しないでください（後から保存した内容が優先されます）。

## 動作確認の手順
ローカル: `npm run dev` → `#/admin` でログイン → 曲の追加/編集/並べ替え/削除/写真 → 保存 → 再読み込み → `#/songs` で確認。
Vercel: 環境変数設定後に再デプロイし、同じ操作を公開URLで行う。ログアウト状態で `#/admin` を開いてもログイン画面になり、curlなどでanonキーのまま書き込んでも拒否されることも確認してください。
