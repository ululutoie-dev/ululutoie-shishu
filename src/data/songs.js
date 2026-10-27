// 詩集データの入口。詩集・曲の中身は src/data/collections/ の各ファイルにあります（追加・変更方法は README 参照）。
// ここでは、それらを読み込んで、アプリが使う形（book / collections / songs）に整えるだけです。歌詞の文字には触れません。
import { collectionDefs } from './registry.js'
import { contrastRatio } from '../lib/theme.js'

export const book = {
  artist: 'うるるといえ',
  subtitle: '詩集',
  untitledLabel: '（曲名未確認）',
  eventLink: { label: 'LIVE／EVENT', url: 'https://event-info-live.vercel.app/#/' },
}

// 詩集：order の小さい順
const sorted = [...collectionDefs].sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || String(a.id).localeCompare(String(b.id)))
export const collections = sorted.map(({ songs, ...c }) => c)

// 曲：各詩集の songs 配列の順に並べ、collectionId と詩集内の order（1から）を付ける
export const songs = sorted.flatMap((c) => c.songs.map((s, i) => ({ ...s, collectionId: c.id, order: i + 1 })))

// 書き間違いに気づくための確認（開発中の console にだけ出る）
if (import.meta.env?.DEV) {
  const ids = new Set()
  for (const c of sorted) {
    const where = `[詩集 ${c.id ?? '(idなし)'}]`
    if (!c.id || !c.title || !Array.isArray(c.songs)) console.error(`${where} id・title・songs が必要です`)
    if (ids.has(c.id)) console.warn(`${where} id が重複しています`); ids.add(c.id)
    const sids = new Set()
    for (const s of c.songs ?? []) {
      if (!s.id || typeof s.lyrics !== 'string') console.error(`${where} 曲に id と lyrics が必要です:`, s.title)
      if (sids.has(s.id)) console.warn(`${where} 曲の id が重複しています: ${s.id}`); sids.add(s.id)
    }
    const r = contrastRatio(c.theme?.bg ?? '#ffffff', c.theme?.ink ?? '#1c1c1c')
    if (r < 4.5) console.warn(`${where} 背景と文字色のコントラストが低めです（${r.toFixed(1)}:1。4.5以上を推奨）`)
  }
}
