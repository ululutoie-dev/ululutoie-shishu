// デザイン設定の一元管理。公開サイトの見た目はここの defaultTheme で決まる。
// 変更方法：#/design の画面で調整 → 「設定コード」をコピー → このファイルの defaultTheme に貼り付けてGitHubへ。
export const fonts = {
  mincho: { label: '明朝体', stack: '"Hiragino Mincho ProN","Yu Mincho","YuMincho","Noto Serif JP","Noto Serif CJK JP",serif' },
  gothic: { label: 'ゴシック体', stack: '"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans JP",sans-serif' },
}
export const defaultTheme = {
  bg: '#ffffff', ink: '#1c1c1c',
  fontTitle: 'mincho', fontBody: 'mincho',
  fsTitle: 1.05,     // 曲名の文字サイズ (rem)。本文より少し控えめな存在感
  fsLyric: 0.95,     // 本文の文字サイズ (rem)
  lhLyric: 1.75,     // 折り返したときの行の間隔（倍率）
  lineGap: 0.4,      // 歌詞の各行の間隔（1行ごとの追加の余白, em）
  paraGap: 2.2,      // 段落（空行）の間の余白 (em)。行間・各行の間隔とは別。空行を重ねるとその倍数になる
  lyricsWidth: 19,   // 歌詞の文字列の幅（全角で約何文字分か, em）。画面いっぱいに広げない
  gapTitle: 3.6,     // 曲名と最初の歌詞の間 (rem)
  pageX: 36, pageY: 56, // ページ全体の余白 (px)
  ruleAlpha: 0.1,    // 曲間・目次の区切り線の濃さ
  // 曲ごとの個別調整（idは songs.js の id）。使える項目: fsLyric, lhLyric, lineGap, gapTitle
  songOverrides: {},
}
export const songKeys = ['fsLyric', 'lhLyric', 'lineGap', 'gapTitle']
const rgba = (hex, a) => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '')
  const n = m ? parseInt(m[1], 16) : 0x1c1c1c
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`
}
export function themeVars(theme) {
  const t = { ...defaultTheme, ...theme }
  return {
    '--bg': t.bg, '--ink': t.ink,
    '--ink-soft': rgba(t.ink, 0.45), '--rule': rgba(t.ink, t.ruleAlpha),
    '--font': (fonts[t.fontBody] || fonts.mincho).stack,
    '--font-title': (fonts[t.fontTitle] || fonts.mincho).stack,
    '--fs-title': `${t.fsTitle}rem`, '--fs-lyric': `${t.fsLyric}rem`,
    '--lh-lyric': String(t.lhLyric), '--line-gap': `${t.lineGap}em`,
    '--para-gap': `${t.paraGap}em`, '--gap-title': `${t.gapTitle}rem`, '--lyrics-width': `${t.lyricsWidth}em`,
    '--page-x': `${t.pageX}px`, '--page-y': `${t.pageY}px`,
  }
}
// 曲ごとの上書き（その曲のページだけに効くCSS変数）
export function songVars(o = {}) {
  const v = {}
  if (o.fsLyric != null) v['--fs-lyric'] = `${o.fsLyric}rem`
  if (o.lhLyric != null) v['--lh-lyric'] = String(o.lhLyric)
  if (o.lineGap != null) v['--line-gap'] = `${o.lineGap}em`
  if (o.gapTitle != null) v['--gap-title'] = `${o.gapTitle}rem`
  return v
}
export function applyTheme(theme) {
  const el = document.documentElement
  for (const [k, v] of Object.entries(themeVars(theme))) el.style.setProperty(k, v)
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', { ...defaultTheme, ...theme }.bg)
}
