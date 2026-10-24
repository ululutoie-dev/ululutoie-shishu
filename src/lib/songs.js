import { songs as raw } from '../data/songs.js'

// 画像は public/ に置くので、サイトのベースパス（通常は "/"）からの相対パスで参照する。
const base = import.meta.env?.BASE_URL ?? '/'
export const photoUrl = (path) => (path ? base + String(path).replace(/^\/+/, '') : null)

// 表示用の曲リスト：order の小さい順（同じ値なら書いた順）。歌詞本文には一切手を加えない。
export const songs = raw.filter(Boolean).sort((a, b) => a.order - b.order).map((s) => ({ ...s, photoUrl: photoUrl(s.photo) }))

if (import.meta.env?.DEV) {
  const seen = new Set()
  for (const s of songs) { if (seen.has(s.id)) console.warn(`[songs.js] id が重複しています: ${s.id}`); seen.add(s.id) }
}
