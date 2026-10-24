import { toParagraphs, leadingIndent } from './lib/lyrics.js'
import { songVars } from './lib/theme.js'

const titleOf = (s, book) => s.title || book.untitledLabel
const pad = (n) => String(n).padStart(2, '0')

export function Cover({ book }) {
  return (
    <main className="page cover">
      <div className="cover-body">
        <h1 className="cover-name">{book.artist}</h1>
        <p className="cover-sub">{book.subtitle}</p>
      </div>
      <a className="cover-link" href="#/songs">目次</a>
    </main>
  )
}

export function SongList({ songs, book }) {
  return (
    <main className="page">
      <nav className="topnav"><a href="#/">表紙</a></nav>
      <ol className="toc">
        {songs.map((s, i) => (
          <li key={s.id}>
            <a href={`#/songs/${s.id}`}>
              <span className="toc-no">{pad(i + 1)}</span>
              <span className="toc-title">{titleOf(s, book)}</span>
            </a>
          </li>
        ))}
      </ol>
    </main>
  )
}

// 行頭の全角スペース（字下げ）はそのまま表示する。そのうえで、折り返しの続きは「字下げ＋1字」下げ、入力した改行と見分けられるようにする。
const indentStyle = (n) => (n ? { paddingLeft: `calc(var(--hang) + ${n}em)`, textIndent: `calc((var(--hang) + ${n}em) * -1)` } : undefined)

// 歌詞：改行＝次の行（1つの <p>）、空行＝段落の区切り（<div class="para"> の間）。全角スペースは white-space: pre-wrap でそのまま表示。
// 原稿の改行と画面幅による折り返しは、折り返しの続きを1字ぶら下げて区別する。
export function Lyrics({ songs, id, book, overrides }) {
  const i = songs.findIndex((x) => x.id === id)
  if (i < 0) return <SongList songs={songs} book={book} />
  const s = songs[i]
  return (
    <main className="page" style={songVars(overrides)}>
      <nav className="topnav"><a href="#/songs">‹ 目次</a></nav>
      {s.photoUrl ? <figure className="song-photo"><img src={s.photoUrl} alt="" loading="lazy" decoding="async" /></figure> : null}
      <header className="song-head">
        <p className="lyrics-no">{pad(i + 1)}</p>
        <h2 className="heading">{titleOf(s, book)}</h2>
      </header>
      <div className="lyrics">
        {toParagraphs(s.lyrics).map((p, k) => (
          <div className="para" key={k} style={p.breaks > 1 ? { marginTop: `calc(var(--para-gap) * ${p.breaks})` } : undefined}>
            {p.lines.map((l, j) => <p className="line" key={j} style={indentStyle(leadingIndent(l))}>{l}</p>)}
          </div>
        ))}
      </div>
      <hr className="end-rule" />
      <nav className="topnav foot"><a href="#/songs">‹ 目次へ戻る</a></nav>
    </main>
  )
}
