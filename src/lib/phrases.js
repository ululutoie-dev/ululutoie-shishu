// 表示専用。歌詞データ(songs.js)は変更しない。
// 原稿の1行の中の全角スペース（フレーズの区切り）ごとに、画面上の独立した1行へ分ける。
// 行頭の全角スペースは字下げとして保持する（indent＝全角スペースの数）。行末の空白は表示に影響しないので省く。
// 空文字の行は {blank:true}（段落の空き）。画面幅による折り返しとは別物で、折り返しはCSSが行う。
export function displayLines(line) {
  if (line === '') return [{ blank: true }]
  const lead = /^\u3000*/.exec(line)[0].length
  const out = line.slice(lead).split(/\u3000+/).filter((p) => p !== '').map((t, i) => ({ t, indent: i === 0 ? lead : 0 }))
  return out.length ? out : [{ blank: true }]
}
