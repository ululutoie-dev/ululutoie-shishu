// デザイン設定の一元管理：既定値・選択肢・CSS変数への変換はすべてここ。
// 管理画面で保存した値（DBの theme）は defaultTheme に上書きされる。
export const fonts = {
  mincho: { label: '明朝体', stack: '"Hiragino Mincho ProN","Yu Mincho","YuMincho","Noto Serif JP","Noto Serif CJK JP",serif' },
  gothic: { label: 'ゴシック体', stack: '"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans JP",sans-serif' },
}
export const defaultTheme = {
  bg: '#f4eee0', ink: '#2a2521',
  fontTitle: 'mincho', fontBody: 'mincho',
  fsLyric: 1, lhLyric: 2.15,   // rem / 倍率
  gapTitle: 2.8,               // 曲名と歌詞の間 (rem)
  pageX: 30, pageY: 48,        // ページ余白 (px)
  ruleAlpha: 0.22,             // 区切り線の濃さ
}
const rgba = (hex, a) => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '')
  const n = m ? parseInt(m[1], 16) : 0x2a2521
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`
}
export function themeVars(theme) {
  const t = { ...defaultTheme, ...theme }
  return {
    '--bg': t.bg, '--ink': t.ink,
    '--ink-soft': rgba(t.ink, 0.55), '--rule': rgba(t.ink, t.ruleAlpha),
    '--font': (fonts[t.fontBody] || fonts.mincho).stack,
    '--font-title': (fonts[t.fontTitle] || fonts.mincho).stack,
    '--fs-lyric': `${t.fsLyric}rem`, '--lh-lyric': String(t.lhLyric),
    '--gap-title': `${t.gapTitle}rem`,
    '--page-x': `${t.pageX}px`, '--page-y': `${t.pageY}px`,
  }
}
export function applyTheme(theme) {
  const el = document.documentElement
  for (const [k, v] of Object.entries(themeVars(theme))) el.style.setProperty(k, v)
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', { ...defaultTheme, ...theme }.bg)
}
