# うるるといえ 詩集（プロトタイプ）

起動: `npm install` → `npm run dev`（同一Wi-Fiのスマホから表示されたURLで確認可）
ビルド: `npm run build`（`dist/` をVercel等へ。ハッシュルーティングのため追加設定不要）

- 歌詞データ: `src/data/songs.js`（表示順は配列順、`confirm` は未確認事項）
- 色・書体・余白: `src/styles/theme.css`
- 画面: `src/App.jsx`（表紙 / 目次 / 歌詞）
