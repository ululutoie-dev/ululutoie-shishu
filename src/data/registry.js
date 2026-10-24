// src/data/collections/ の中の .js ファイルを、すべて自動で読み込む。
// 新しい詩集は、そのフォルダにファイルを1つ足すだけ（ここは編集しない）。
const modules = import.meta.glob('./collections/*.js', { eager: true })
export const collectionDefs = Object.values(modules).map((m) => m.default)
