import { useState } from 'react'
import { themeVars, fonts, defaultTheme, songKeys } from '../lib/theme.js'
import { Cover, SongList, Lyrics } from '../views.jsx'
import './design.css'

// このページの変更は「この画面の中のプレビュー」だけに反映され、保存されず、公開サイトにも影響しない。
// 公開サイトに反映するには、下の「設定コード」を src/lib/theme.js の defaultTheme に貼ってGitHubへ。
const fmt = (v) => (typeof v === 'string' ? `'${v}'` : v)
const code = (t) => {
  const { songOverrides: so, ...rest } = t
  const ov = Object.entries(so).filter(([, o]) => Object.keys(o).length)
    .map(([id, o]) => `    '${id}': { ${Object.entries(o).map(([k, v]) => `${k}: ${v}`).join(', ')} },`).join('\n')
  return `export const defaultTheme = {\n${Object.entries(rest).map(([k, v]) => `  ${k}: ${fmt(v)},`).join('\n')}\n  songOverrides: {${ov ? `\n${ov}\n  ` : ''}},\n}`
}
const PHONES = [360, 390, 430]
const songRanges = { fsLyric: [0.85, 1.3, 0.01, 'rem', '本文の文字サイズ'], lhLyric: [1.4, 2.4, 0.05, '', '行間（折り返し時）'], lineGap: [0, 1.5, 0.05, 'em', '各行の間隔'], gapTitle: [1, 8, 0.1, 'rem', '曲名と歌詞の間'] }

export default function DesignEditor({ songs, book }) {
  const [theme, setTheme] = useState(defaultTheme)
  const [view, setView] = useState('lyrics')
  const [song, setSong] = useState(songs[0].id)
  const [width, setWidth] = useState(390)
  const [copied, setCopied] = useState(false)
  const set = (k) => (e) => setTheme((t) => ({ ...t, [k]: e.target.type === 'range' ? Number(e.target.value) : e.target.value }))
  const Range = ({ k, label, min, max, step, unit = '' }) => (
    <label className="ds-row"><span>{label}<b>{theme[k]}{unit}</b></span><input type="range" min={min} max={max} step={step} value={theme[k]} onChange={set(k)} /></label>
  )
  const ov = theme.songOverrides[song] || {}
  const setOv = (k, v) => setTheme((t) => ({ ...t, songOverrides: { ...t.songOverrides, [song]: { ...(t.songOverrides[song] || {}), [k]: v } } }))
  const clearOv = () => setTheme((t) => { const { [song]: _x, ...rest } = t.songOverrides; return { ...t, songOverrides: rest } })
  const text = code(theme)
  const copy = async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* 下の欄から手動でコピー */ } }
  const cur = songs.find((s) => s.id === song)

  return (
    <div className="ds">
      <header className="ds-bar"><strong>デザイン調整</strong><a href="#/">公開ページへ戻る</a></header>
      <p className="ds-note">ここでの変更は<b>プレビューのみ</b>です。保存されず、公開サイトにも反映されません。気に入った設定は下の「設定コード」を <code>src/lib/theme.js</code> に貼り付け、GitHubへ反映（→Vercelで公開）してください。</p>
      <div className="ds-grid">
        <section className="ds-panel">
          <h3>全体</h3>
          <label className="ds-row"><span>背景色</span><input type="color" value={theme.bg} onChange={set('bg')} /></label>
          <label className="ds-row"><span>本文の文字色</span><input type="color" value={theme.ink} onChange={set('ink')} /></label>
          {[['fontTitle', '曲名の書体'], ['fontBody', '本文の書体']].map(([k, l]) => (
            <label className="ds-row" key={k}><span>{l}</span>
              <select value={theme[k]} onChange={set(k)}>{Object.entries(fonts).map(([v, f]) => <option key={v} value={v}>{f.label}</option>)}</select></label>
          ))}
          <Range k="fsTitle" label="曲名の文字サイズ" min={0.9} max={2} step={0.05} unit="rem" />
          <Range k="fsLyric" label="本文の文字サイズ" min={0.85} max={1.3} step={0.01} unit="rem" />
          <Range k="lhLyric" label="行間（折り返し時）" min={1.4} max={2.4} step={0.05} />
          <Range k="lineGap" label="歌詞の各行の間隔" min={0} max={1.5} step={0.05} unit="em" />
          <Range k="lyricsWidth" label="歌詞の文字列の幅" min={12} max={26} step={0.5} unit="em" />
          <Range k="gapTitle" label="曲名と歌詞の間" min={1} max={8} step={0.1} unit="rem" />
          <Range k="pageX" label="左右の余白" min={16} max={64} step={1} unit="px" />
          <Range k="pageY" label="上下の余白" min={24} max={96} step={1} unit="px" />
          <Range k="ruleAlpha" label="曲間・目次の区切りの濃さ" min={0.03} max={0.5} step={0.01} />
          <button onClick={() => setTheme(defaultTheme)}>公開中の設定に戻す</button>

          <h3>この曲だけ調整（{cur.title || book.untitledLabel}）</h3>
          <p className="hint">言葉の密度に合わせて、曲ごとに上書きできます。「歌詞」タブで曲を選んでください。</p>
          {songKeys.map((k) => { const [min, max, step, unit, label] = songRanges[k]; const val = ov[k] ?? theme[k]; return (
            <label className="ds-row" key={k}><span>{label}<b>{val}{unit}{ov[k] != null ? '（個別）' : ''}</b></span><input type="range" min={min} max={max} step={step} value={val} onChange={(e) => setOv(k, Number(e.target.value))} /></label>
          ) })}
          <button onClick={clearOv} disabled={!Object.keys(ov).length}>この曲の個別調整を解除</button>

          <h3>設定コード</h3>
          <textarea readOnly rows={16} value={text} onFocus={(e) => e.target.select()} />
          <button className="primary" onClick={copy}>{copied ? 'コピーしました' : '設定コードをコピー'}</button>
        </section>
        <section className="ds-prev">
          <div className="ds-tabs">
            {[['cover', '表紙'], ['list', '目次'], ['lyrics', '歌詞']].map(([v, l]) => <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{l}</button>)}
            {view === 'lyrics' && <select value={song} onChange={(e) => setSong(e.target.value)}>{songs.map((s, i) => <option key={s.id} value={s.id}>{String(i + 1).padStart(2, '0')} {s.title || book.untitledLabel}</option>)}</select>}
          </div>
          <div className="ds-tabs">
            <span className="hint">スマホ幅：</span>
            {PHONES.map((w) => <button key={w} className={width === w ? 'on' : ''} onClick={() => setWidth(w)}>{w}px</button>)}
          </div>
          <div className="preview-frame" style={{ ...themeVars(theme), width }}>
            {view === 'cover' && <Cover book={book} />}
            {view === 'list' && <SongList songs={songs} book={book} />}
            {view === 'lyrics' && <Lyrics songs={songs} id={song} book={book} overrides={theme.songOverrides[song]} />}
          </div>
        </section>
      </div>
    </div>
  )
}
