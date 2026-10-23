// 表示専用：1行を「フレーズ＋後ろの全角スペース数」に分ける。歌詞データは変更しない。
// 原稿の行内の全角スペースは、画面上では「折り返し位置になれる空き」として表示する。
export function splitLine(text) {
  const out = { lead: 0, phrases: [] }
  let pend = 0
  for (const part of text.split(/(\u3000+)/)) {
    if (part === '') continue
    if (/^\u3000+$/.test(part)) {
      if (out.phrases.length === 0) out.lead = part.length
      else pend = part.length
    } else {
      if (out.phrases.length) out.phrases[out.phrases.length - 1].gap = pend
      pend = 0
      out.phrases.push({ t: part, gap: 0 })
    }
  }
  return out // 行末の全角スペースは表示しない（データには残る）
}
